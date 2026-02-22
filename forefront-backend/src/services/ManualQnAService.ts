import { pool } from '../config/db.js';
import { generateEmbedding } from '../utils/embeddings.js';

export class ManualQnAService {
    /**
     * Create a manual Q&A knowledge source container
     */
    async createQnASource(agentId: string, name: string = 'Manual Q&A') {
        const result = await pool.query(
            `INSERT INTO knowledge_sources (agent_id, type, content, name, status)
             VALUES ($1, 'manual_qna', 'Manual Q&A collection', $2, 'completed')
             RETURNING *`,
            [agentId, name]
        );
        return result.rows[0];
    }

    /**
     * Add a single Q&A pair with auto-generated embeddings
     */
    async addQnAPair(
        sourceId: string,
        question: string,
        answer: string,
        category: string | null = null,
        language: string = 'en-IN'
    ) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Insert Q&A pair
            const result = await client.query(
                `INSERT INTO qna_pairs (knowledge_source_id, question, answer, category, language)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [sourceId, question, answer, category, language]
            );
            const qna = result.rows[0];

            // 2. Generate embedding for combined Q+A text
            const combinedText = `Question: ${question}\nAnswer: ${answer}`;
            const embedding = await generateEmbedding(combinedText);

            // 3. Store in knowledge_vectors (reusing existing table)
            await client.query(
                `INSERT INTO knowledge_vectors (source_id, content_chunk, embedding)
                 VALUES ($1, $2, $3)`,
                [sourceId, combinedText, JSON.stringify(embedding)]
            );

            await client.query('COMMIT');
            return qna;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    /**
     * Update a Q&A pair and re-generate embeddings
     */
    async updateQnAPair(qnaId: string, updates: { question?: string; answer?: string; category?: string }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                `UPDATE qna_pairs
                 SET question = COALESCE($2, question),
                     answer = COALESCE($3, answer),
                     category = COALESCE($4, category),
                     updated_at = NOW()
                 WHERE id = $1
                 RETURNING *`,
                [qnaId, updates.question, updates.answer, updates.category]
            );
            const qna = result.rows[0];
            if (!qna) throw new Error('Q&A pair not found');

            // Re-generate embeddings if question or answer changed
            if (updates.question || updates.answer) {
                // Delete old vectors for this Q&A
                await client.query(
                    `DELETE FROM knowledge_vectors
                     WHERE source_id = $1
                       AND content_chunk LIKE $2`,
                    [qna.knowledge_source_id, `Question: %`]
                );

                // Generate new embedding
                const combinedText = `Question: ${qna.question}\nAnswer: ${qna.answer}`;
                const embedding = await generateEmbedding(combinedText);

                await client.query(
                    `INSERT INTO knowledge_vectors (source_id, content_chunk, embedding)
                     VALUES ($1, $2, $3)`,
                    [qna.knowledge_source_id, combinedText, JSON.stringify(embedding)]
                );
            }

            await client.query('COMMIT');
            return qna;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    /**
     * Delete a Q&A pair and its embeddings
     */
    async deleteQnAPair(qnaId: string) {
        // Get the source_id and question text first
        const { rows } = await pool.query('SELECT * FROM qna_pairs WHERE id = $1', [qnaId]);
        if (rows.length === 0) throw new Error('Q&A pair not found');

        const qna = rows[0];
        const combinedText = `Question: ${qna.question}\nAnswer: ${qna.answer}`;

        // Delete the vector
        await pool.query(
            `DELETE FROM knowledge_vectors WHERE source_id = $1 AND content_chunk = $2`,
            [qna.knowledge_source_id, combinedText]
        );

        // Delete the Q&A pair
        await pool.query('DELETE FROM qna_pairs WHERE id = $1', [qnaId]);
    }

    /**
     * Get all Q&A pairs for a knowledge source
     */
    async getQnAPairs(sourceId: string) {
        const result = await pool.query(
            `SELECT * FROM qna_pairs
             WHERE knowledge_source_id = $1
             ORDER BY created_at DESC`,
            [sourceId]
        );
        return result.rows;
    }

    /**
     * Search Q&A pairs by fuzzy text similarity
     */
    async searchQnAPairs(sourceId: string, queryText: string) {
        const result = await pool.query(
            `SELECT *, similarity(question, $2) as score
             FROM qna_pairs
             WHERE knowledge_source_id = $1
               AND similarity(question, $2) > 0.3
             ORDER BY score DESC
             LIMIT 10`,
            [sourceId, queryText]
        );
        return result.rows;
    }

    /**
     * Increment usage count when a Q&A is used in a response
     */
    async incrementUsage(qnaId: string) {
        await pool.query(
            `UPDATE qna_pairs SET usage_count = usage_count + 1 WHERE id = $1`,
            [qnaId]
        );
    }
}
