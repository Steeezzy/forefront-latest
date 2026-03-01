/**
 * VectorSearchService — pgvector cosine similarity search
 *
 * Queries document_chunks table using pgvector's <=> (cosine distance) operator.
 *
 * @example
 * const svc = new VectorSearchService();
 * const results = await svc.search(kbId, queryEmbedding, { top_k: 5, min_score: 0.7 });
 */

import { pool } from '../../config/db.js';
import { EmbeddingService } from './EmbeddingService.js';

export interface SearchResult {
    chunk_id: string;
    document_id: string;
    chunk_text: string;
    chunk_index: number;
    score: number; // cosine similarity (1 - distance)
    metadata: Record<string, any>;
    document_name?: string;
}

export interface SearchOptions {
    top_k: number;
    min_score: number;
    filter_metadata?: Record<string, any>;
}

export class VectorSearchService {
    private embeddingService: EmbeddingService;

    constructor(embeddingModel?: string, dimensions?: number) {
        this.embeddingService = new EmbeddingService(embeddingModel, dimensions);
    }

    /**
     * Search by raw text query (embeds the query first, then searches)
     */
    async searchByText(
        kbId: string,
        queryText: string,
        options: SearchOptions = { top_k: 5, min_score: 0.7 }
    ): Promise<SearchResult[]> {
        const { embedding } = await this.embeddingService.embedText(queryText);
        return this.search(kbId, embedding, options);
    }

    /**
     * Search by pre-computed embedding vector
     */
    async search(
        kbId: string,
        queryEmbedding: number[],
        options: SearchOptions = { top_k: 5, min_score: 0.7 }
    ): Promise<SearchResult[]> {
        const vectorStr = `[${queryEmbedding.join(',')}]`;

        // Cosine distance: lower = more similar. Convert to similarity: 1 - distance.
        const result = await pool.query(
            `SELECT
                dc.id as chunk_id,
                dc.document_id,
                dc.chunk_text,
                dc.chunk_index,
                dc.metadata,
                d.name as document_name,
                1 - (dc.embedding <=> $1::vector) as score
             FROM document_chunks dc
             JOIN kb_documents d ON d.id = dc.document_id
             WHERE dc.kb_id = $2
               AND 1 - (dc.embedding <=> $1::vector) >= $3
             ORDER BY dc.embedding <=> $1::vector
             LIMIT $4`,
            [vectorStr, kbId, options.min_score, options.top_k]
        );

        return result.rows.map((row: any) => ({
            chunk_id: row.chunk_id,
            document_id: row.document_id,
            chunk_text: row.chunk_text,
            chunk_index: row.chunk_index,
            score: parseFloat(row.score),
            metadata: row.metadata || {},
            document_name: row.document_name,
        }));
    }

    /**
     * Build a formatted context string from search results
     */
    buildContext(results: SearchResult[], format: 'numbered' | 'plain' = 'numbered'): string {
        if (results.length === 0) return '';

        if (format === 'numbered') {
            return results.map((r, i) =>
                `[${i + 1}] (Source: ${r.document_name || 'Unknown'}, Score: ${r.score.toFixed(2)})\n${r.chunk_text}`
            ).join('\n\n');
        }

        return results.map(r => r.chunk_text).join('\n\n---\n\n');
    }
}
