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

export class RerankerService {

    /**
     * Rerank results using best available method.
     */
    async rerank(query: string, results: SearchResult[], topN: number = 5): Promise<RankedResult[]> {
        if (results.length === 0) return [];

        const cohereKey = process.env.COHERE_API_KEY;
        let ranked: RankedResult[];

        if (cohereKey) {
            ranked = await this.cohereRerank(query, results, cohereKey);
        } else {
            ranked = this.bm25Rerank(query, results);
        }

        return ranked
            .sort((a, b) => b.rerank_score - a.rerank_score)
            .slice(0, topN);
    }

    /**
     * Cohere rerank API call.
     */
    private async cohereRerank(
        query: string,
        results: SearchResult[],
        apiKey: string
    ): Promise<RankedResult[]> {
        try {
            const response = await fetch('https://api.cohere.com/v2/rerank', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'rerank-english-v3.0',
                    query,
                    documents: results.map((r) => r.chunk_text),
                    top_n: results.length,
                    return_documents: false,
                }),
            });

            if (!response.ok) {
                console.warn('[Reranker] Cohere API error, falling back to BM25');
                return this.bm25Rerank(query, results);
            }

            const data = (await response.json()) as {
                results: Array<{ index: number; relevance_score: number }>;
            };

            return data.results.map((r) => ({
                ...results[r.index],
                rerank_score: r.relevance_score,
            }));
        } catch (error: any) {
            console.warn('[Reranker] Cohere call failed:', error.message);
            return this.bm25Rerank(query, results);
        }
    }

    /**
     * BM25-inspired local reranking fallback.
     * Combines term overlap (0.4 weight) with original vector score (0.6 weight).
     */
    private bm25Rerank(query: string, results: SearchResult[]): RankedResult[] {
        const queryTokens = this.tokenize(query);

        return results.map((result) => {
            const chunkTokens = this.tokenize(result.chunk_text);
            const bm25Score = this.calculateBM25(queryTokens, chunkTokens);
            const combinedScore = 0.4 * bm25Score + 0.6 * result.score;

            return {
                ...result,
                rerank_score: combinedScore,
            };
        });
    }

    /**
     * Simple term overlap ratio as BM25 approximation.
     */
    private calculateBM25(queryTokens: string[], chunkTokens: string[]): number {
        if (queryTokens.length === 0) return 0;

        const chunkSet = new Set(chunkTokens);
        let matches = 0;
        for (const token of queryTokens) {
            if (chunkSet.has(token)) matches++;
        }

        // Normalized overlap + length bonus for shorter chunks (more focused)
        const overlap = matches / queryTokens.length;
        const lengthPenalty = Math.min(1.0, 200 / Math.max(chunkTokens.length, 1));
        return overlap * 0.8 + lengthPenalty * 0.2;
    }

    /**
     * Simple word tokenizer: lowercase, split on non-alphanumeric, remove stopwords.
     */
    private tokenize(text: string): string[] {
        const stopwords = new Set([
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
            'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'about',
            'it', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we',
            'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its',
            'our', 'their', 'what', 'which', 'who', 'when', 'where', 'how', 'and',
            'but', 'or', 'not', 'no', 'if', 'so', 'than', 'too', 'very',
        ]);

        return text
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((t) => t.length > 1 && !stopwords.has(t));
    }

    /**
     * Build a context string from ranked results, truncated at maxTokens.
     */
    buildContext(results: RankedResult[] | SearchResult[], maxTokens: number = 3000): string {
        if (results.length === 0) return '';

        let context = '';
        let tokenEstimate = 0;
        const tokensPerChar = 0.25; // ~4 chars per token

        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            const header = `[Source ${i + 1}: ${r.document_name || 'Document'}]\n`;
            const section = header + r.chunk_text + '\n\n';
            const sectionTokens = Math.ceil(section.length * tokensPerChar);

            if (tokenEstimate + sectionTokens > maxTokens) {
                // Partial insertion
                const remainingTokens = maxTokens - tokenEstimate;
                const remainingChars = Math.floor(remainingTokens / tokensPerChar);
                context += section.slice(0, remainingChars) + '...';
                break;
            }

            context += section;
            tokenEstimate += sectionTokens;
        }

        return context.trim();
    }
}

export const rerankerService = new RerankerService();
