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
export class VectorSearchService {
    embeddingService;
    constructor(embeddingModel, dimensions) {
        this.embeddingService = new EmbeddingService(embeddingModel, dimensions);
    }
    /**
     * Search by raw text query (embeds the query first, then searches)
     */
    async searchByText(kbId, queryText, options = { top_k: 5, min_score: 0.7 }) {
        const { embedding } = await this.embeddingService.embedText(queryText);
        return this.search(kbId, embedding, options);
    }
    /**
     * Search by pre-computed embedding vector
     */
    async search(kbId, queryEmbedding, options = { top_k: 5, min_score: 0.7 }) {
        const vectorStr = `[${queryEmbedding.join(',')}]`;
        // Cosine distance: lower = more similar. Convert to similarity: 1 - distance.
        const result = await pool.query(`SELECT
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
             LIMIT $4`, [vectorStr, kbId, options.min_score, options.top_k]);
        return result.rows.map((row) => ({
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
    buildContext(results, format = 'numbered') {
        if (results.length === 0)
            return '';
        if (format === 'numbered') {
            return results.map((r, i) => `[${i + 1}] (Source: ${r.document_name || 'Unknown'}, Score: ${r.score.toFixed(2)})\n${r.chunk_text}`).join('\n\n');
        }
        return results.map(r => r.chunk_text).join('\n\n---\n\n');
    }
}
//# sourceMappingURL=VectorSearchService.js.map