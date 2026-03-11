import { env } from '../config/env.js';
export class SarvamClient {
    apiKey;
    baseURL = 'https://api.sarvam.ai';
    constructor() {
        this.apiKey = env.SARVAM_API_KEY || '';
        if (!this.apiKey) {
            console.warn('SarvamClient: SARVAM_API_KEY is not set.');
        }
    }
    async request(endpoint, method, body, isMultipart = false) {
        if (!this.apiKey)
            throw new Error('SARVAM_API_KEY is missing');
        const headers = {
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
    async chatCompletion(messages, options = {}) {
        // Chat endpoint usually requires /v1 per previous implementation
        return this.request('/v1/chat/completions', 'POST', {
            model: options.model || 'sarvam-m',
            messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 500,
            stop: options.stop
        });
    }
    /**
     * Speech to Text (Saaras/Saarika)
     */
    async speechToText(audioBlob, language_code = 'hi-IN') {
        const formData = new FormData();
        // Determine if it's a Blob or Buffer and append accordingly
        // For Node.js (Buffer), we might need to cast or handle specifically if utilizing node-fetch behaviors matching browser standard
        // Assuming standard FormData compatibility or polyfill is active in Node env via 'undici' or similar in newer Node versions
        // Note: In Node environment with native fetch (Node 18+), FormData is available.
        // If passing a Buffer, we might need a Blob-like wrapper or just pass it if supported.
        // For robust file upload in Node, usually we construct a File/Blob.
        // Cast buffer to any to bypass strict BlobPart check if needed in this env types
        // In Node 18+ Blob accepts Buffer.
        const file = new Blob([audioBlob], { type: 'audio/wav' });
        formData.append('file', file, 'audio.wav');
        formData.append('model', 'saaras:v3'); // Updated to v3 per error message
        // Checking doc: usually 'saaras:v1' is standard. The user doc said 'saaras:v3', likely specific to their preview. I'll stick to 'saaras:v1' for safety or 'saaras:v1' as default, but let's use user's suggestion if valid.
        // User doc said: saaras:v3. I will allow overriding model.
        // Actually, let's stick to standard `saaras:v1` unless we are sure. But I'll trust the user's intent or generic.
        // Let's use 'saaras:v1' for now to ensure stability, or 'saaras:v1' 
        formData.append('language_code', language_code || 'hi-IN');
        return this.request('/speech-to-text', 'POST', formData, true);
    }
    /**
     * Text to Speech (Bulbul)
     */
    async textToSpeech(text, target_language_code = 'hi-IN', speaker = 'meera') {
        const response = await this.request('/text-to-speech', 'POST', {
            inputs: [text],
            target_language_code,
            speaker,
            pitch: 0,
            pace: 1.0,
            loudness: 1.5,
            speech_sample_rate: 16000,
            enable_preprocessing: true,
            model: 'bulbul:v1'
        });
        // Returns { audios: ["base64string"] }
        return response.audios?.[0];
    }
    /**
     * Translation
     */
    async translate(input, source_language_code, target_language_code) {
        const response = await this.request('/translate', 'POST', {
            input,
            source_language_code,
            target_language_code,
            model: 'mayura:v1',
            enable_preprocessing: true
        });
        return response.translated_text;
    }
}
export const sarvamClient = new SarvamClient();
//# sourceMappingURL=SarvamClient.js.map