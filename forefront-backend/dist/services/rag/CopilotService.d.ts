/**
 * CopilotService — Agent-assist features (not customer-facing).
 *
 * Helps human agents by providing:
 * - Suggested reply drafts based on KB context
 * - KB article search from inbox
 * - Tone rephrasing (professional, friendly, concise)
 */
import type { CopilotRequest, CopilotResponse, CopilotSuggestion } from '../../types/rag.types.js';
export declare class CopilotService {
    private embeddingService;
    private searchService;
    private rerankerService;
    constructor();
    /**
     * Main suggestion entry point — routes to the right handler by requestType.
     */
    getSuggestions(request: CopilotRequest): Promise<CopilotResponse>;
    /**
     * Direct KB search from the inbox UI.
     */
    searchKB(query: string, workspaceId: string): Promise<CopilotSuggestion[]>;
    private generateReplyDraft;
    private searchKBForAgent;
    private rephraseInTones;
    private buildSources;
}
export declare const copilotService: CopilotService;
//# sourceMappingURL=CopilotService.d.ts.map