/**
 * Antigravity Flow Templates Library — 32 RAG-Enhanced Templates
 *
 * Every flow has silent RAG (Retrieval-Augmented Generation) running
 * in the background. The visitor never sees "searching..." — RAG
 * automatically pulls relevant context from the user's knowledge base
 * (scraped URLs, uploaded docs, FAQs) before delivering responses.
 *
 * Categories: Sales (10), Leads (8), Support (14)
 *
 * RAG behavior rules:
 * - RAG always runs silently — visitor never sees "searching..."
 * - RAG query auto-constructed from: visitor message + current page URL + last 3 turns
 * - Confidence >= 0.75 → use RAG answer to enrich response
 * - Confidence < 0.75  → use fallback message + offer human handoff
 * - RAG never overrides hardcoded discounts/coupons — only enriches product/policy descriptions
 * - Every response feels natural and conversational, NOT like a database lookup
 */
export interface FlowTemplate {
    name: string;
    description: string;
    category: 'sales' | 'leads' | 'support';
    trigger_type: string;
    is_active: boolean;
    uses?: number;
    tone_default?: 'friendly' | 'professional' | 'warm';
    rag_config?: {
        enabled: boolean;
        min_confidence: number;
        fallback_message: string;
        instruction?: string;
    };
    nodes: any[];
    edges: any[];
}
export declare const flowTemplates: FlowTemplate[];
export declare function getTemplatesByCategory(category: string): FlowTemplate[];
export declare function getTemplateCounts(): Record<string, number>;
//# sourceMappingURL=flow-templates.d.ts.map