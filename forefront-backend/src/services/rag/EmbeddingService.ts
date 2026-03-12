/**
 * EmbeddingService — handles all embedding model API calls
 *
 * Now uses Xenova/nomic-embed-text-v1 (local, free)
 *
 * @example
 * const svc = new EmbeddingService();
 * const vector = await svc.embedText("Hello world");
 * const vectors = await svc.embedBatch(["Hello", "World"]);
 */

import { generateEmbedding } from '../../utils/embeddings.js';

interface EmbeddingResult {
    embedding: number[];
    tokens_used: number;
}

export class EmbeddingService {
    private model: string;
    private dimensions: number;

    constructor(
        model: string = 'nomic-embed-text-v1',
        dimensions: number = 768
    ) {
        this.model = model;
        this.dimensions = dimensions;
    }

    /**
     * Embed a single text string
     */
    async embedText(text: string): Promise<EmbeddingResult> {
        const results = await this.embedBatch([text]);
        return results[0];
    }

    /**
     * Embed multiple texts in a single API call
     */
    async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
        if (texts.length === 0) return [];

        const results: EmbeddingResult[] = [];
        for (const text of texts) {
            const embedding = await generateEmbedding(text);
            results.push({
                embedding,
                tokens_used: this.estimateTokens(text)
            });
        }

        return results;
    }

    /**
     * Estimate token count for a text (rough approximation: 1 token ≈ 4 chars)
     */
    estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }
}
