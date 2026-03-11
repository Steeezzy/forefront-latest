/**
 * EmbeddingService — handles all embedding model API calls
 *
 * Supports: OpenAI text-embedding-3-small (default)
 * Future: Cohere, local models
 *
 * @example
 * const svc = new EmbeddingService();
 * const vector = await svc.embedText("Hello world");
 * const vectors = await svc.embedBatch(["Hello", "World"]);
 */
interface EmbeddingResult {
    embedding: number[];
    tokens_used: number;
}
export declare class EmbeddingService {
    private apiKey;
    private model;
    private dimensions;
    constructor(model?: string, dimensions?: number);
    /**
     * Embed a single text string
     */
    embedText(text: string): Promise<EmbeddingResult>;
    /**
     * Embed multiple texts in a single API call (max 2048 per batch for OpenAI)
     */
    embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
    private _callOpenAI;
    /**
     * Estimate token count for a text (rough approximation: 1 token ≈ 4 chars)
     */
    estimateTokens(text: string): number;
}
export {};
//# sourceMappingURL=EmbeddingService.d.ts.map