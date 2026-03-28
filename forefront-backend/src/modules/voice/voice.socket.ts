import { Socket } from 'socket.io';
import { SarvamClient } from '../../services/SarvamClient.js';
import { VoiceAgentService } from './voice.service.js';
import { OrchestratorService } from '../orchestrator/orchestrator.service.js';
import { pool } from '../config/db.js';

interface VoiceSession {
    socketId: string;
    agentId: string;
    workspaceId: string;
    callDirection: 'inbound' | 'outbound' | 'webcall';
    sessionId: string;
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

        socket.on('voice:join', async (data: { agentId: string; workspaceId: string; callDirection?: string }) => {
            try {
                const { agentId, workspaceId, callDirection = 'webcall' } = data;

                // Validate agent exists and belongs to workspace
                const agent = await this.voiceAgentService.getAgent(agentId, workspaceId);
                if (!agent) {
                    socket.emit('voice:error', { message: 'Voice agent not found or access denied' });
                    return;
                }

                // Check voice agent limit (already done on creation, but double-check)
                const sessionId = this.generateSessionId();
                const session: VoiceSession = {
                    socketId: socket.id,
                    agentId,
                    workspaceId,
                    callDirection: callDirection as any,
                    sessionId,
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
                const mimeType = data.mimeType || 'audio/webm';

                // 1. Speech-to-Text
                const transcription = await this.sarvamClient.speechToText(new Blob([audioBuffer], { type: mimeType }), 'en-IN');
                const userMessage = transcription?.text || '';

                if (!userMessage.trim()) {
                    return; // No speech detected
                }

                console.log(`Transcribed: "${userMessage}"`);

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
                    userMessage,
                    sessionId: session.sessionId,
                    agentType: agent.agent_type,
                    callDirection: session.callDirection,
                });

                console.log(`AI Response: "${response.message}"`);

                // 3. Text-to-Speech
                const ttsResult = await this.sarvamClient.textToSpeech(
                    response.message,
                    agent.language || 'en-IN',
                    agent.voice || 'sarvam-tanya'
                );

                // ttsResult is base64 encoded WAV audio from Sarvam
                if (ttsResult) {
                    console.log(`TTS success: length=${ttsResult.length}, sample=${ttsResult.substring(0, 50)}`);
                    socket.emit('voice:tts', {
                        audio: ttsResult,
                        text: response.message,
                        sessionId: data.sessionId,
                        contentType: 'audio/wav', // Sarvam TTS returns WAV
                    });
                } else {
                    console.error('TTS returned empty result');
                }

                // 4. Log the turn (optional: store in database for analytics)
                await this.logVoiceTurn(session.sessionId, userMessage, response.message, session.agentId, session.workspaceId);

            } catch (error: any) {
                console.error('Voice audio processing error:', error);
                socket.emit('voice:error', { message: 'Audio processing failed', details: error.message });
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
}
