import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';
import { DocumentIngestionService } from '../../services/rag/DocumentIngestionService.js';
import { VectorSearchService } from '../../services/rag/VectorSearchService.js';

export async function kbRoutes(app: FastifyInstance) {

    // GET /api/kb?agentId= — List all knowledge bases
    app.get('/', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { agentId } = z.object({ agentId: z.string().uuid() }).parse(req.query);
            const result = await pool.query(
                `SELECT * FROM knowledge_bases WHERE agent_id = $1 ORDER BY created_at DESC`,
                [agentId]
            );
            return reply.send({ knowledge_bases: result.rows });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    // POST /api/kb — Create a new KB
    app.post('/', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = z.object({
                agentId: z.string().uuid(),
                name: z.string().min(1),
                description: z.string().optional(),
                embedding_model: z.string().optional(),
                embedding_dimensions: z.number().optional(),
                chunk_strategy: z.enum(['fixed_size', 'sentence', 'paragraph']).optional(),
                chunk_size: z.number().min(50).max(8000).optional(),
                chunk_overlap: z.number().min(0).max(500).optional(),
            }).parse(req.body);

            const result = await pool.query(
                `INSERT INTO knowledge_bases (agent_id, name, description, embedding_model, embedding_dimensions, chunk_strategy, chunk_size, chunk_overlap)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [
                    body.agentId, body.name, body.description || null,
                    body.embedding_model || 'text-embedding-3-small',
                    body.embedding_dimensions || 1536,
                    body.chunk_strategy || 'fixed_size',
                    body.chunk_size || 512,
                    body.chunk_overlap || 50
                ]
            );
            return reply.status(201).send({ knowledge_base: result.rows[0] });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    // GET /api/kb/:id — KB detail + stats
    app.get('/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const result = await pool.query(`SELECT * FROM knowledge_bases WHERE id = $1`, [id]);
            if (result.rows.length === 0) return reply.status(404).send({ error: 'KB not found' });

            const docs = await pool.query(
                `SELECT id, name, source_type, status, chunk_count, token_count, created_at FROM kb_documents WHERE kb_id = $1 ORDER BY created_at DESC`,
                [id]
            );

            return reply.send({ knowledge_base: result.rows[0], documents: docs.rows });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    // DELETE /api/kb/:id — Delete KB + all chunks
    app.delete('/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const result = await pool.query(`DELETE FROM knowledge_bases WHERE id = $1 RETURNING id`, [id]);
            if (result.rows.length === 0) return reply.status(404).send({ error: 'KB not found' });
            return reply.send({ success: true });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    // POST /api/kb/:id/documents — Add document (text or URL)
    app.post('/:id/documents', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id: kbId } = z.object({ id: z.string().uuid() }).parse(req.params);
            const body = z.object({
                name: z.string().min(1),
                source_type: z.enum(['file_upload', 'url', 'text', 'api']).optional(),
                raw_text: z.string().min(1),
                metadata: z.record(z.string(), z.any()).optional(),
            }).parse(req.body);

            // Verify KB exists
            const kb = await pool.query(`SELECT * FROM knowledge_bases WHERE id = $1`, [kbId]);
            if (kb.rows.length === 0) return reply.status(404).send({ error: 'KB not found' });
            const kbRow = kb.rows[0];

            // Create document record
            const docResult = await pool.query(
                `INSERT INTO kb_documents (kb_id, name, source_type, metadata) VALUES ($1, $2, $3, $4) RETURNING *`,
                [kbId, body.name, body.source_type || 'text', JSON.stringify(body.metadata || {})]
            );
            const doc = docResult.rows[0];

            // Run ingestion pipeline (in-process for now, can be moved to Bull queue later)
            const ingestionService = new DocumentIngestionService(kbRow.embedding_model, kbRow.embedding_dimensions);
            const result = await ingestionService.ingestDocument(kbId, doc.id, body.raw_text, {
                strategy: kbRow.chunk_strategy,
                chunk_size: kbRow.chunk_size,
                chunk_overlap: kbRow.chunk_overlap,
            });

            return reply.status(201).send({
                document: { ...doc, status: 'indexed' },
                ingestion: result,
            });
        } catch (error: any) {
            console.error('Ingestion error:', error);
            return reply.status(500).send({ error: error.message });
        }
    });

    // GET /api/kb/:id/documents — List documents in a KB
    app.get('/:id/documents', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const result = await pool.query(
                `SELECT * FROM kb_documents WHERE kb_id = $1 ORDER BY created_at DESC`,
                [id]
            );
            return reply.send({ documents: result.rows });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    // DELETE /api/kb/:id/documents/:docId — Remove document + chunks
    app.delete('/:id/documents/:docId', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const params = z.object({ id: z.string().uuid(), docId: z.string().uuid() }).parse(req.params);
            await pool.query(`DELETE FROM kb_documents WHERE id = $1 AND kb_id = $2`, [params.docId, params.id]);
            // Update KB counts
            await pool.query(
                `UPDATE knowledge_bases SET
                    doc_count = (SELECT COUNT(*) FROM kb_documents WHERE kb_id = $1 AND status = 'indexed'),
                    chunk_count = (SELECT COUNT(*) FROM document_chunks WHERE kb_id = $1)
                 WHERE id = $1`, [params.id]
            );
            return reply.send({ success: true });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    // POST /api/kb/search — Direct vector search (for testing)
    app.post('/search', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = z.object({
                kb_id: z.string().uuid(),
                query: z.string().min(1),
                top_k: z.number().min(1).max(50).optional(),
                min_score: z.number().min(0).max(1).optional(),
            }).parse(req.body);

            const kb = await pool.query(`SELECT * FROM knowledge_bases WHERE id = $1`, [body.kb_id]);
            if (kb.rows.length === 0) return reply.status(404).send({ error: 'KB not found' });

            const searchService = new VectorSearchService(kb.rows[0].embedding_model, kb.rows[0].embedding_dimensions);
            const results = await searchService.searchByText(body.kb_id, body.query, {
                top_k: body.top_k || 5,
                min_score: body.min_score || 0.7,
            });

            return reply.send({
                results,
                context: searchService.buildContext(results),
                total_results: results.length,
            });
        } catch (error: any) {
            console.error('Search error:', error);
            return reply.status(500).send({ error: error.message });
        }
    });
}
