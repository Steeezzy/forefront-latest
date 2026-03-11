export interface AIResponse {
    content: string;
    confidence: number;
    sources: string[];
    shouldEscalate: boolean;
    model: string;
    tokensUsed: number;
}
export declare class EnhancedRAGService {
    private chatService;
    constructor();
    resolveAIResponse(workspaceId: string, conversationId: string, userMessage: string, options?: {
        enableEscalation?: boolean;
        escalationThreshold?: number;
    }): Promise<AIResponse>;
    private searchKnowledge;
    private calculateConfidence;
    private buildMessages;
    private logEscalation;
    suggestReplies(conversationId: string, workspaceId: string): Promise<string[]>;
    rewriteDraft(draft: string, tone?: string): Promise<string>;
}
export declare const enhancedRAGService: EnhancedRAGService;
//# sourceMappingURL=enhanced-rag.service.d.ts.map