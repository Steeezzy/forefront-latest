export declare class ManualQnAService {
    /**
     * Create a manual Q&A knowledge source container
     */
    createQnASource(agentId: string, name?: string): Promise<any>;
    /**
     * Add a single Q&A pair with auto-generated embeddings
     */
    addQnAPair(sourceId: string, question: string, answer: string, category?: string | null, language?: string): Promise<any>;
    /**
     * Update a Q&A pair and re-generate embeddings
     */
    updateQnAPair(qnaId: string, updates: {
        question?: string;
        answer?: string;
        category?: string;
    }): Promise<any>;
    /**
     * Delete a Q&A pair and its embeddings
     */
    deleteQnAPair(qnaId: string): Promise<void>;
    /**
     * Get all Q&A pairs for a knowledge source
     */
    getQnAPairs(sourceId: string): Promise<any[]>;
    /**
     * Search Q&A pairs by fuzzy text similarity
     */
    searchQnAPairs(sourceId: string, queryText: string): Promise<any[]>;
    /**
     * Increment usage count when a Q&A is used in a response
     */
    incrementUsage(qnaId: string): Promise<void>;
}
//# sourceMappingURL=ManualQnAService.d.ts.map