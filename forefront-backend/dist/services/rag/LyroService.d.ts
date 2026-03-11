/**
 * LyroService — Main AI orchestration engine.
 *
 * Full pipeline: input guardrails → embed → search → rerank → context build →
 * Sarvam/OpenAI chat with function calling → output guardrails → handoff check.
 *
 * Uses Sarvam AI as primary LLM (per project rules), OpenAI for embeddings only.
 */
import type { LyroResponse, LyroSession } from '../../types/rag.types.js';
export declare class LyroService {
    private embeddingService;
    private searchService;
    private rerankerService;
    private guardrailsService;
    private toolRegistryService;
    private handoffService;
    constructor();
    /**
     * Main chat method — full RAG + AI pipeline.
     */
    chat(params: {
        message: string;
        session_id: string;
        conversation_id: string;
        workspace_id: string;
        contact_id?: string;
    }): Promise<LyroResponse>;
    getSession(sessionId: string): Promise<LyroSession | null>;
    clearSession(sessionId: string): Promise<void>;
    private createSession;
    private updateSession;
    private calculateConfidence;
    private buildSources;
    private buildBlockedResponse;
}
export declare const lyroService: LyroService;
//# sourceMappingURL=LyroService.d.ts.map