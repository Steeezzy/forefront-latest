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
export declare class SarvamClient {
    private apiKey;
    private baseURL;
    constructor();
    private request;
    /**
     * Chat Completion using Sarvam-M
     */
    chatCompletion(messages: ChatMessage[], options?: SarvamChatOptions): Promise<unknown>;
    /**
     * Speech to Text (Saaras/Saarika)
     */
    speechToText(audioBlob: Blob | Buffer, language_code?: string): Promise<unknown>;
    /**
     * Text to Speech (Bulbul)
     */
    textToSpeech(text: string, target_language_code?: string, speaker?: string): Promise<any>;
    /**
     * Translation
     */
    translate(input: string, source_language_code: string, target_language_code: string): Promise<any>;
}
export declare const sarvamClient: SarvamClient;
//# sourceMappingURL=SarvamClient.d.ts.map