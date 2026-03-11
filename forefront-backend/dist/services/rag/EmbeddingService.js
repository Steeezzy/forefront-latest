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
export class EmbeddingService {
    apiKey;
    model;
    dimensions;
    constructor(model = process.env.EMBEDDING_DEFAULT_MODEL || 'text-embedding-3-small', dimensions = 1536) {
        this.apiKey = process.env.OPENAI_API_KEY || '';
        this.model = model;
        this.dimensions = dimensions;
        if (!this.apiKey) {
            console.warn('OPENAI_API_KEY is not set. EmbeddingService will fail.');
        }
    }
    /**
     * Embed a single text string
     */
    async embedText(text) {
        const results = await this.embedBatch([text]);
        return results[0];
    }
    /**
     * Embed multiple texts in a single API call (max 2048 per batch for OpenAI)
     */
    async embedBatch(texts) {
        if (texts.length === 0)
            return [];
        // OpenAI allows max 2048 inputs per request
        const BATCH_LIMIT = 2048;
        const allResults = [];
        for (let i = 0; i < texts.length; i += BATCH_LIMIT) {
            const batch = texts.slice(i, i + BATCH_LIMIT);
            const results = await this._callOpenAI(batch);
            allResults.push(...results);
        }
        return allResults;
    }
    async _callOpenAI(texts) {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                input: texts,
                dimensions: this.dimensions,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI Embedding API error (${response.status}): ${error}`);
        }
        const data = await response.json();
        const tokensPerItem = Math.ceil(data.usage.total_tokens / texts.length);
        return data.data
            .sort((a, b) => a.index - b.index)
            .map((item) => ({
            embedding: item.embedding,
            tokens_used: tokensPerItem,
        }));
    }
    /**
     * Estimate token count for a text (rough approximation: 1 token ≈ 4 chars)
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
}
//# sourceMappingURL=EmbeddingService.js.map