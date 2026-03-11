/**
 * RerankerService — Cross-encoder reranking + context builder.
 *
 * Takes initial vector search results and reranks using:
 * 1. Cohere rerank API (if COHERE_API_KEY set)
 * 2. Fallback: BM25-inspired term overlap scoring
 */
import type { SearchResult } from './VectorSearchService.js';
export interface RankedResult extends SearchResult {
    rerank_score: number;
}
export declare class RerankerService {
    /**
     * Rerank results using best available method.
     */
    rerank(query: string, results: SearchResult[], topN?: number): Promise<RankedResult[]>;
    /**
     * Cohere rerank API call.
     */
    private cohereRerank;
    /**
     * BM25-inspired local reranking fallback.
     * Combines term overlap (0.4 weight) with original vector score (0.6 weight).
     */
    private bm25Rerank;
    /**
     * Simple term overlap ratio as BM25 approximation.
     */
    private calculateBM25;
    /**
     * Simple word tokenizer: lowercase, split on non-alphanumeric, remove stopwords.
     */
    private tokenize;
    /**
     * Build a context string from ranked results, truncated at maxTokens.
     */
    buildContext(results: RankedResult[] | SearchResult[], maxTokens?: number): string;
}
export declare const rerankerService: RerankerService;
//# sourceMappingURL=RerankerService.d.ts.map