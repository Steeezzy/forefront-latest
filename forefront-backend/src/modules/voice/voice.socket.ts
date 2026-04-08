import { Socket } from 'socket.io';
import { SarvamClient } from '../../services/SarvamClient.js';
import { VoiceAgentService } from './voice.service.js';
import { OrchestratorService } from '../orchestrator/orchestrator.service.js';
import { pool } from '../../config/db.js';
import { toSarvamLanguageCode, toSarvamSpeaker } from './sarvam-mapping.js';
import { cleanModelOutput } from '../../utils/strip-thinking.js';

interface VoiceSession {
    socketId: string;
    agentId: string;
    workspaceId: string;
    callDirection: 'inbound' | 'outbound' | 'webcall';
    sessionId: string;
    agentLanguageCode: string;
    callerLanguageCode: string;
    enableLiveTranslation: boolean;
    isMuted: boolean;
    createdAt: Date;
}

export class VoiceSocketHandler {
    private sessions: Map<string, VoiceSession> = new Map();
    private sarvamClient: SarvamClient;
    private voiceAgentService: VoiceAgentService;
    private orchestratorService: OrchestratorService;

    constructor() {
        this.sarvamClient = new SarvamClient();
        this.voiceAgentService = new VoiceAgentService();
        this.orchestratorService = new OrchestratorService();
    }

    // Attach voice-specific event handlers to a socket
    handleConnection(socket: Socket) {
        console.log(`Voice socket connected: ${socket.id}`);

        socket.on('voice:join', async (data: { agentId: string; workspaceId: string; callDirection?: string; callerLanguage?: string; enableLiveTranslation?: boolean }) => {
            try {
                const { agentId, workspaceId, callDirection = 'webcall' } = data;

                // Validate agent exists and belongs to workspace
                const agent = await this.voiceAgentService.getAgent(agentId, workspaceId);
                if (!agent) {
                    socket.emit('voice:error', { message: 'Voice agent not found or access denied' });
                    return;
                }

                const agentLanguageCode = toSarvamLanguageCode(agent.language || 'en-IN');
                const callerLanguageCode = toSarvamLanguageCode(data.callerLanguage || agent.language || 'en-IN');
                const enableLiveTranslation = Boolean(data.enableLiveTranslation);

                // Check voice agent limit (already done on creation, but double-check)
                const sessionId = this.generateSessionId();
                const session: VoiceSession = {
                    socketId: socket.id,
                    agentId,
                    workspaceId,
                    callDirection: callDirection as any,
                    sessionId,
                    agentLanguageCode,
                    callerLanguageCode,
                    enableLiveTranslation,
                    isMuted: false,
                    createdAt: new Date(),
                };

                this.sessions.set(socket.id, session);

                // Join agent-specific room for routing
                socket.join(`voice:agent:${agentId}`);
                socket.join(`voice:session:${sessionId}`);

                socket.emit('voice:joined', {
                    sessionId,
                    agent,
                    agentLanguageCode,
                    callerLanguageCode,
                    liveTranslation: enableLiveTranslation,
                    message: `Connected to voice agent ${agent.name}`,
                });

                console.log(`Voice session started: ${sessionId} for agent ${agentId}, workspace ${workspaceId}`);
            } catch (error: any) {
                console.error('Voice join error:', error);
                socket.emit('voice:error', { message: error.message || 'Failed to join voice session' });
            }
        });

        socket.on('voice:audio', async (data: { audio: string; sessionId: string; mimeType?: string }) => {
            const session = this.sessions.get(socket.id);
            if (!session || session.sessionId !== data.sessionId) {
                socket.emit('voice:error', { message: 'Invalid session' });
                return;
            }

            try {
                // audio is base64 encoded from browser
                const audioBuffer = Buffer.from(data.audio, 'base64');
                const mimeType = ((data.mimeType || 'audio/webm').split(';')[0] || 'audio/webm').trim().toLowerCase();
                const callerLanguageCode = session.callerLanguageCode || 'en-IN';
                const agentLanguageCode = session.agentLanguageCode || 'en-IN';
                const shouldTranslate = session.enableLiveTranslation && callerLanguageCode !== agentLanguageCode;

                // 1. Speech-to-Text
                const transcription = await this.sarvamClient.speechToText(audioBuffer, callerLanguageCode, mimeType) as any;
                const userMessage = this.normalizeUserTranscript(this.extractTranscriptionText(transcription));

                if (!userMessage.trim()) {
                    return; // No speech detected
                }

                if (this.isTrivialVoiceInput(userMessage)) {
                    return;
                }

                console.log(`Transcribed: "${userMessage}"`);

                let translatedUserMessage: string | null = null;
                let messageForOrchestrator = userMessage;

                if (shouldTranslate) {
                    translatedUserMessage = await this.safeTranslate(userMessage, callerLanguageCode, agentLanguageCode);
                    if (translatedUserMessage) {
                        messageForOrchestrator = translatedUserMessage;
                    }
                }

                socket.emit('voice:transcript', {
                    sessionId: data.sessionId,
                    speaker: 'user',
                    originalText: userMessage,
                    translatedText: translatedUserMessage,
                    languageCode: callerLanguageCode,
                    translatedLanguageCode: translatedUserMessage ? agentLanguageCode : null,
                    timestamp: new Date().toISOString(),
                });

                // 2. Get AI Response via orchestrator (multi-prompt aware)
                const agent = await this.voiceAgentService.getAgent(session.agentId, session.workspaceId);
                if (!agent) {
                    socket.emit('voice:error', { message: 'Agent not found' });
                    return;
                }

                // Build context from agent and conversation
                const response = await this.orchestratorService.processVoiceTurn({
                    agentId: session.agentId,
                    workspaceId: session.workspaceId,
                    userMessage: messageForOrchestrator,
                    sessionId: session.sessionId,
                    agentType: agent.agent_type,
                    callDirection: session.callDirection,
                });

                const assistantBaseMessage = this.prepareVoiceAssistantMessage(response.message);
                console.log(`AI Response: "${assistantBaseMessage}"`);

                let translatedAssistantMessage: string | null = null;
                let assistantSpeechText = assistantBaseMessage;

                if (shouldTranslate) {
                    translatedAssistantMessage = await this.safeTranslate(assistantBaseMessage, agentLanguageCode, callerLanguageCode);
                    if (translatedAssistantMessage) {
                        assistantSpeechText = this.prepareVoiceAssistantMessage(translatedAssistantMessage);
                    }
                }

                socket.emit('voice:transcript', {
                    sessionId: data.sessionId,
                    speaker: 'assistant',
                    originalText: assistantBaseMessage,
                    translatedText: translatedAssistantMessage,
                    languageCode: agentLanguageCode,
                    translatedLanguageCode: translatedAssistantMessage ? callerLanguageCode : null,
                    timestamp: new Date().toISOString(),
                });

                // 3. Text-to-Speech
                const targetLanguageCode = translatedAssistantMessage ? callerLanguageCode : agentLanguageCode;
                const speaker = toSarvamSpeaker(agent.voice || 'sarvam-tanya');
                const ttsResult = await this.sarvamClient.textToSpeech(
                    assistantSpeechText,
                    targetLanguageCode,
                    speaker
                );

                // ttsResult is base64 encoded WAV audio from Sarvam
                if (ttsResult) {
                    console.log(`TTS success: length=${ttsResult.length}, sample=${ttsResult.substring(0, 50)}`);
                    socket.emit('voice:tts', {
                        audio: ttsResult,
                        text: assistantSpeechText,
                        originalText: assistantBaseMessage,
                        translatedText: translatedAssistantMessage,
                        sessionId: data.sessionId,
                        contentType: 'audio/wav', // Sarvam TTS returns WAV
                        shouldEndCall: response.shouldEndCall,
                    });
                } else {
                    console.error('TTS returned empty result');
                }

                // 4. Log the turn (optional: store in database for analytics)
                await this.logVoiceTurn(session.sessionId, userMessage, assistantBaseMessage, session.agentId, session.workspaceId);

            } catch (error: any) {
                console.error('Voice audio processing error:', error);
                socket.emit('voice:error', {
                    message: 'Audio processing failed',
                    details: error?.message || 'Unknown audio processing error',
                });
            }
        });

        // WebRTC signaling handlers (for future direct peer connections)
        // Currently not used as we use MediaRecorder + socket.io for audio streaming
        /*
        socket.on('voice:ice-candidate', (data: { candidate: any; sessionId: string }) => {
            const session = this.sessions.get(socket.id);
            if (session && session.sessionId === data.sessionId) {
                socket.to(`voice:session:${data.sessionId}`).emit('voice:ice-candidate', {
                    candidate: data.candidate,
                    from: socket.id,
                });
            }
        });

        socket.on('voice:offer', (data: { offer: any; sessionId: string }) => {
            const session = this.sessions.get(socket.id);
            if (session && session.sessionId === data.sessionId) {
                socket.to(`voice:session:${data.sessionId}`).emit('voice:offer', {
                    offer: data.offer,
                    from: socket.id,
                });
            }
        });

        socket.on('voice:answer', (data: { answer: any; sessionId: string }) => {
            const session = this.sessions.get(socket.id);
            if (session && session.sessionId === data.sessionId) {
                socket.to(`voice:session:${data.sessionId}`).emit('voice:answer', {
                    answer: data.answer,
                    from: socket.id,
                });
            }
        });
        */

        socket.on('voice:end', (data: { sessionId: string }) => {
            const session = this.sessions.get(socket.id);
            if (session && session.sessionId === data.sessionId) {
                this.cleanupSession(socket.id);
                socket.leave(`voice:session:${data.sessionId}`);
                socket.emit('voice:ended', { sessionId: data.sessionId });
                console.log(`Voice session ended: ${data.sessionId}`);
            }
        });

        socket.on('disconnect', () => {
            if (socket.data.user) {
                console.log(`Voice socket disconnected: ${socket.id} (user ${socket.data.user.userId})`);
            }
            this.cleanupSession(socket.id);
        });
    }

    private generateSessionId(): string {
        return `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private async logVoiceTurn(sessionId: string, userMessage: string, aiMessage: string, agentId: string, workspaceId: string) {
        try {
            await pool.query(
                `INSERT INTO voice_call_logs (session_id, agent_id, workspace_id, user_message, ai_message, turn_number, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [sessionId, agentId, workspaceId, userMessage, aiMessage, 1] // TODO: compute turn number from existing logs
            );
        } catch (error) {
            console.error('Failed to log voice turn:', error);
        }
    }

    private cleanupSession(socketId: string) {
        const session = this.sessions.get(socketId);
        if (session) {
            this.sessions.delete(socketId);
            // Optionally, emit to other participants that this user left
        }
    }

    private extractTranscriptionText(transcription: any): string {
        if (!transcription) {
            return '';
        }

        const direct = transcription.text || transcription.transcript || transcription.output_text;
        if (typeof direct === 'string' && direct.trim()) {
            return direct.trim();
        }

        if (Array.isArray(transcription.segments)) {
            const merged = transcription.segments
                .map((segment: any) => segment?.text)
                .filter((value: any) => typeof value === 'string' && value.trim())
                .join(' ')
                .trim();
            if (merged) {
                return merged;
            }
        }

        if (Array.isArray(transcription.results)) {
            const merged = transcription.results
                .map((item: any) => item?.text || item?.transcript)
                .filter((value: any) => typeof value === 'string' && value.trim())
                .join(' ')
                .trim();
            if (merged) {
                return merged;
            }
        }

        return '';
    }

    private normalizeUserTranscript(input: string): string {
        return (input || '')
            .replace(/\s+/g, ' ')
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'")
            .trim();
    }

    private isTrivialVoiceInput(input: string): boolean {
        const normalized = input.trim().toLowerCase();
        if (!normalized) {
            return true;
        }

        return [
            'uh',
            'um',
            'hmm',
            'mm',
            'mmm',
            'okay',
            'ok',
            'yeah',
            'yes',
            'right',
        ].includes(normalized);
    }

    private prepareVoiceAssistantMessage(input: string): string {
        let raw = cleanModelOutput(input);
        raw = raw
            .replace(/\(\s*translation\s*:[\s\S]*?\)$/i, ' ')
            .replace(/\(\s*translated\s*:[\s\S]*?\)$/i, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const sentences = raw
            .split(/(?<=[.!?।])\s+/u)
            .map((sentence) => sentence.trim())
            .filter(Boolean);

        const metaPatterns = [
            /\bthe user is asking\b/i,
            /\bthis translates to\b/i,
            /\bi need to understand\b/i,
            /\bi need to\b/i,
            /\bi should\b/i,
            /\bmy role is\b/i,
            /\bi will respond\b/i,
            /\blet me think\b/i,
            /\bfirst,\s*i\b/i,
            /\bokay,\s*the user\b/i,
        ];

        const meaningfulSentences = sentences.filter((sentence) =>
            !metaPatterns.some((pattern) => pattern.test(sentence))
        );

        const cleaned = (meaningfulSentences.length > 0 ? meaningfulSentences.join(' ') : raw)
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleaned) {
            return 'I am here to help. Please tell me how I can assist you.';
        }

        if (cleaned.length <= 220) {
            return cleaned;
        }

        let compact = '';
        for (const sentence of cleaned.split(/(?<=[.!?।])\s+/u).filter(Boolean)) {
            const next = compact ? `${compact} ${sentence}` : sentence;
            if (next.length > 220) {
                break;
            }
            compact = next;
        }

        if (compact && compact.length >= 20) {
            return compact;
        }

        return `${cleaned.slice(0, 217).trimEnd()}...`;
    }

    private async safeTranslate(text: string, sourceLanguageCode: string, targetLanguageCode: string): Promise<string | null> {
        const normalized = (text || '').trim();
        if (!normalized || sourceLanguageCode === targetLanguageCode) {
            return null;
        }

        try {
            const translated = await this.sarvamClient.translate(normalized, sourceLanguageCode, targetLanguageCode);
            if (typeof translated === 'string' && translated.trim()) {
                return translated.trim();
            }
            return null;
        } catch (error: any) {
            console.warn(`Live translation failed (${sourceLanguageCode} -> ${targetLanguageCode})`, error?.message || error);
            return null;
        }
    }
}
