/**
 * CopilotService — Agent-assist features (not customer-facing).
 *
 * Helps human agents by providing:
 * - Suggested reply drafts based on KB context
 * - KB article search from inbox
 * - Tone rephrasing (professional, friendly, concise)
 */

import { EmbeddingService } from './EmbeddingService.js';
import { VectorSearchService, type SearchResult } from './VectorSearchService.js';
import { RerankerService } from './RerankerService.js';
import { sarvamClient } from '../SarvamClient.js';
import type {
    CopilotRequest,
    CopilotResponse,
    CopilotSuggestion,
    RagSource,
} from '../../types/rag.types.js';

export class CopilotService {
    private embeddingService: EmbeddingService;
    private searchService: VectorSearchService;
    private rerankerService: RerankerService;

    constructor() {
        this.embeddingService = new EmbeddingService();
        this.searchService = new VectorSearchService();
        this.rerankerService = new RerankerService();
    }

    /**
     * Main suggestion entry point — routes to the right handler by requestType.
     */
    async getSuggestions(request: CopilotRequest): Promise<CopilotResponse> {
        const startTime = Date.now();

        let suggestions: CopilotSuggestion[] = [];

        switch (request.request_type) {
            case 'reply_draft':
                suggestions = await this.generateReplyDraft(request);
                break;
            case 'kb_search':
                suggestions = await this.searchKBForAgent(request);
                break;
            case 'tone_rephrase':
                suggestions = await this.rephraseInTones(request);
                break;
            case 'all':
                // Run reply_draft + kb_search in parallel
                const [draftSuggestions, kbSuggestions] = await Promise.all([
                    this.generateReplyDraft(request),
                    this.searchKBForAgent(request),
                ]);
                suggestions = [...draftSuggestions, ...kbSuggestions];
                break;
        }

        return {
            suggestions,
            processing_ms: Date.now() - startTime,
        };
    }

    /**
     * Direct KB search from the inbox UI.
     */
    async searchKB(query: string, workspaceId: string): Promise<CopilotSuggestion[]> {
        const results = await this.searchService.searchByText(workspaceId, query, {
            top_k: 5,
            min_score: 0.6,
        });

        const reranked = await this.rerankerService.rerank(query, results, 5);

        return reranked.map((r) => ({
            type: 'kb_article' as const,
            content: r.chunk_text,
            label: r.document_name || 'KB Article',
            sources: [
                {
                    document_id: r.document_id,
                    title: r.document_name,
                    excerpt: r.chunk_text.slice(0, 200),
                    score: r.score,
                },
            ],
            confidence: r.score,
        }));
    }

    // ─── Reply Draft ───────────────────────────────────────────────────

    private async generateReplyDraft(request: CopilotRequest): Promise<CopilotSuggestion[]> {
        // Get the last customer message
        const lastCustomerMsg = [...request.messages]
            .reverse()
            .find((m) => m.role === 'user');

        if (!lastCustomerMsg) return [];

        // Search KB for relevant context
        const results = await this.searchService.searchByText(
            request.workspace_id,
            lastCustomerMsg.content,
            { top_k: 6, min_score: 0.65 }
        );

        const reranked = await this.rerankerService.rerank(
            lastCustomerMsg.content,
            results,
            3
        );

        const context = this.rerankerService.buildContext(reranked, 2000);

        // Build conversation transcript for context
        const transcript = request.messages
            .slice(-6)
            .map((m) => `${m.role === 'user' ? 'Customer' : 'Agent'}: ${m.content}`)
            .join('\n');

        try {
            const response: any = await sarvamClient.chatCompletion([
                {
                    role: 'system',
                    content: `You are a helper for customer support agents. Given a customer conversation and knowledge base context, draft a helpful, professional reply for the agent to send to the customer.

Keep it under 150 words. Be accurate — only use information from the KB context. If the KB doesn't have the answer, suggest the agent look into it manually.

KB Context:
${context || 'No relevant KB articles found.'}

Conversation:
${transcript}`,
                },
                {
                    role: 'user',
                    content: 'Draft a reply for the agent to send to the customer.',
                },
            ], { temperature: 0.3, max_tokens: 300 });

            const draftText = response.choices?.[0]?.message?.content || '';

            return [
                {
                    type: 'reply_draft',
                    content: draftText,
                    label: 'Suggested Reply',
                    sources: this.buildSources(reranked),
                    confidence: reranked.length > 0 ? reranked[0].score : 0.5,
                },
            ];
        } catch (error: any) {
            console.error('[Copilot] Reply draft error:', error.message);
            return [];
        }
    }

    // ─── KB Search for Agent ───────────────────────────────────────────

    private async searchKBForAgent(request: CopilotRequest): Promise<CopilotSuggestion[]> {
        const lastCustomerMsg = [...request.messages]
            .reverse()
            .find((m) => m.role === 'user');

        if (!lastCustomerMsg) return [];

        return this.searchKB(lastCustomerMsg.content, request.workspace_id);
    }

    // ─── Tone Rephrase ─────────────────────────────────────────────────

    private async rephraseInTones(request: CopilotRequest): Promise<CopilotSuggestion[]> {
        if (!request.draft_text) return [];

        const tones = ['Professional', 'Friendly', 'Concise'];

        try {
            const response: any = await sarvamClient.chatCompletion([
                {
                    role: 'system',
                    content: `Rephrase the following customer support message in 3 different tones. Return them as JSON array:
[{"tone": "Professional", "text": "..."}, {"tone": "Friendly", "text": "..."}, {"tone": "Concise", "text": "..."}]

Original message:
${request.draft_text}`,
                },
                {
                    role: 'user',
                    content: 'Provide the 3 tone variations as JSON.',
                },
            ], { temperature: 0.4, max_tokens: 600 });

            const rawResponse = response.choices?.[0]?.message?.content || '[]';

            // Try to parse JSON from response
            let variations: Array<{ tone: string; text: string }>;
            try {
                const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
                variations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            } catch {
                // Fallback: split by tone
                variations = tones.map((tone) => ({ tone, text: request.draft_text || '' }));
            }

            return variations.map((v) => ({
                type: 'tone_rephrase' as const,
                content: v.text,
                label: v.tone,
            }));
        } catch (error: any) {
            console.error('[Copilot] Tone rephrase error:', error.message);
            return [];
        }
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    private buildSources(results: SearchResult[]): RagSource[] {
        return results.map((r) => ({
            document_id: r.document_id,
            title: r.document_name,
            excerpt: r.chunk_text.slice(0, 200),
            score: r.score,
        }));
    }
}

export const copilotService = new CopilotService();
