/**
 * VectorSearchService — pgvector cosine similarity search
 *
 * Queries document_chunks table using pgvector's <=> (cosine distance) operator.
 *
 * @example
 * const svc = new VectorSearchService();
 * const results = await svc.search(kbId, queryEmbedding, { top_k: 5, min_score: 0.7 });
 */
export interface SearchResult {
    chunk_id: string;
    document_id: string;
    chunk_text: string;
    chunk_index: number;
    score: number;
    metadata: Record<string, any>;
    document_name?: string;
}
export interface SearchOptions {
    top_k: number;
    min_score: number;
    filter_metadata?: Record<string, any>;
}
export declare class VectorSearchService {
    private embeddingService;
    constructor(embeddingModel?: string, dimensions?: number);
    /**
     * Search by raw text query (embeds the query first, then searches)
     */
    searchByText(kbId: string, queryText: string, options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * Search by pre-computed embedding vector
     */
    search(kbId: string, queryEmbedding: number[], options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * Build a formatted context string from search results
     */
    buildContext(results: SearchResult[], format?: 'numbered' | 'plain'): string;
}
//# sourceMappingURL=VectorSearchService.d.ts.map