import { env } from '../config/env.js';
import { stripThinkingTags, cleanModelOutput } from '../utils/strip-thinking.js';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface SarvamChatOptions {
    model?: 'sarvam-m';
    temperature?: number;
    max_tokens?: number;
    stop?: string[];
}

export class SarvamClient {
    private apiKey: string;
    private baseURL: string = 'https://api.sarvam.ai';

    constructor() {
        this.apiKey = env.SARVAM_API_KEY || '';
        if (!this.apiKey) {
            console.warn('SarvamClient: SARVAM_API_KEY is not set.');
        }
    }

    private async request(endpoint: string, method: string, body?: any, isMultipart: boolean = false) {
        if (!this.apiKey) throw new Error('SARVAM_API_KEY is missing');

        const headers: any = {
            'api-subscription-key': this.apiKey,
        };

        if (!isMultipart) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method,
            headers,
            body: isMultipart ? body : JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Sarvam API Error (${response.status}): ${errorText}`);
        }

        return response.json();
    }

    /**
     * Chat Completion using Sarvam-M
     */
    async chatCompletion(messages: ChatMessage[], options: SarvamChatOptions = {}) {
        // Chat endpoint usually requires /v1 per previous implementation
        const data: any = await this.request('/v1/chat/completions', 'POST', {
            model: options.model || 'sarvam-m',
            messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 500,
            stop: options.stop
        });

        // Strip thinking tags from ALL Sarvam responses
        const raw = data.choices?.[0]?.message?.content || '';
        data.choices[0].message.content = cleanModelOutput(raw);

        return data;
    }

    /**
     * Speech to Text (Saaras/Saarika)
     */
    async speechToText(audioBlob: Blob | Buffer, language_code: string = 'hi-IN', mimeType: string = 'audio/webm') {
        const rawMime = (mimeType || (audioBlob instanceof Blob ? audioBlob.type : '') || 'audio/webm').toLowerCase();
        const normalizedMime = rawMime.split(';')[0].trim() || 'audio/webm';

        const runAttempt = async (model: string, uploadMimeType: string) => {
            const formData = new FormData();
            const extension = this.getAudioExtension(uploadMimeType);
            const file = audioBlob instanceof Blob
                ? new Blob([audioBlob], { type: uploadMimeType })
                : new Blob([audioBlob as any], { type: uploadMimeType });

            formData.append('file', file, `audio.${extension}`);
            formData.append('model', model);
            formData.append('language_code', language_code || 'hi-IN');

            return this.request('/speech-to-text', 'POST', formData, true);
        };

        try {
            return await runAttempt('saaras:v3', normalizedMime);
        } catch (error: any) {
            const details = String(error?.message || '').toLowerCase();
            const recoverable = details.includes('failed to read the file') || details.includes('invalid file type');
            if (!recoverable) {
                throw error;
            }

            const retryMime = normalizedMime === 'audio/webm' ? 'video/webm' : normalizedMime;
            return runAttempt('saaras:v1', retryMime);
        }
    }

    private getAudioExtension(mimeType: string): string {
        if (mimeType.includes('webm')) return 'webm';
        if (mimeType.includes('ogg')) return 'ogg';
        if (mimeType.includes('mp4')) return 'mp4';
        if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
        if (mimeType.includes('wav')) return 'wav';
        if (mimeType.includes('flac')) return 'flac';
        return 'webm';
    }

    /**
     * Text to Speech (Bulbul)
     */
    async textToSpeech(text: string, target_language_code: string = 'hi-IN', speaker: string = 'meera') {
        const safeText = this.normalizeTtsInput(text);

        const response: any = await this.request('/text-to-speech', 'POST', {
            inputs: [safeText],
            target_language_code,
            speaker,
            pace: 1.0,
            speech_sample_rate: 16000,
            enable_preprocessing: true,
            model: 'bulbul:v3'
        });

        // Returns { audios: ["base64string"] }
        return response.audios?.[0];
    }

    private normalizeTtsInput(input: string): string {
        const cleaned = cleanModelOutput(input);

        if (!cleaned) {
            return 'I am here to help.';
        }

        if (cleaned.length <= 500) {
            return cleaned;
        }

        return `${cleaned.slice(0, 497).trimEnd()}...`;
    }

    /**
     * Translation
     */
    async translate(input: string, source_language_code: string, target_language_code: string) {
        const response: any = await this.request('/translate', 'POST', {
            input,
            source_language_code,
            target_language_code,
            model: 'mayura:v1',
            enable_preprocessing: true
        });
        return response.translated_text;
    }

    /**
     * Identify Language
     */
    async identifyLanguage(text: string): Promise<{language: string}> {
        try {
            // Using chat completion to detect language reliably if no exact endpoint is known, 
            // or mapping to a known language detection endpoint.
            const response: any = await this.chatCompletion([
                { role: 'system', content: 'You are a language detector. Reply ONLY with the exact 5-character language code (e.g. "en-IN", "hi-IN", "ta-IN") of the user\'s text from the 22 Indian languages. If unknown, reply "en-IN".' },
                { role: 'user', content: text }
            ], { temperature: 0.1, max_tokens: 10 });
            
            const detectedMatch = response?.choices?.[0]?.message?.content?.trim();
            if (detectedMatch && detectedMatch.length === 5 && detectedMatch.includes('-IN')) {
                return { language: detectedMatch };
            }
            return { language: 'en-IN' };
        } catch (error) {
            console.error('Sarvam identifyLanguage error:', error);
            return { language: 'en-IN' };
        }
    }
}


export const sarvamClient = new SarvamClient();
