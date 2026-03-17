import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as crypto from 'crypto';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware.js';
import { KnowledgeService } from './knowledge.service.js';
import { ManualQnAService } from '../../services/ManualQnAService.js';
import { WebsiteScrapingService } from '../../services/WebsiteScrapingService.js';
import { CSVImportService } from '../../services/CSVImportService.js';
import { ZendeskService } from '../../services/ZendeskService.js';
import { pool } from '../../config/db.js';
import { enhancedRAGService } from '../chat/enhanced-rag.service.js';

const knowledgeService = new KnowledgeService();
const qnaService = new ManualQnAService();
const websiteService = new WebsiteScrapingService();
const csvService = new CSVImportService();
const zendeskService = new ZendeskService();

// ============================================================
// Validation Schemas
// ============================================================
const addSourceSchema = z.object({
    agentId: z.string().uuid(),
    type: z.enum(['text', 'url', 'pdf', 'qa_pair']),
    content: z.string().min(1),
});

const websiteSchema = z.object({
    agentId: z.string().uuid(),
    url: z.string().url(),
    name: z.string().max(255).optional(),
    mode: z.enum(['priority', 'single']).default('priority'),
});

const createQnASourceSchema = z.object({
    agentId: z.string().uuid(),
    name: z.string().max(255).optional(),
});

const addQnAPairSchema = z.object({
    sourceId: z.string().uuid(),
    question: z.string().min(3),
    answer: z.string().min(5),
    category: z.string().max(255).optional(),
    language: z.string().max(10).optional(),
});

const updateQnAPairSchema = z.object({
    question: z.string().min(3).optional(),
    answer: z.string().min(5).optional(),
    category: z.string().max(255).optional(),
});

const zendeskSchema = z.object({
    agentId: z.string().uuid(),
    subdomain: z.string().min(1),
    email: z.string().email(),
    apiToken: z.string().min(1),
});

const csvImportSchema = z.object({
    agentId: z.string().uuid(),
    name: z.string().max(255).optional(),
});

export async function knowledgeRoutes(app: FastifyInstance) {

    // ============================================================
    // RAG Chat — Test Conversa endpoint
    // ============================================================

    /**
     * POST /knowledge/chat
     * RAG-powered question answering against the knowledge base
     * NOW ALIGNED WITH ENHANCED RAG (CONVERSA DEMO)
     * CORS-enabled for widget access from any domain
     * DEPLOYMENT_VERIFICATION_MARKER_1200_UTC
     */
    app.post('/chat', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            // Add CORS headers for widget access
            reply.header('Access-Control-Allow-Origin', '*');
            reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
            reply.header('Access-Control-Allow-Headers', 'Content-Type');

            // Handle preflight
            if (req.method === 'OPTIONS') {
                return reply.code(200).send();
            }

            console.log('[RAG Chat] Incoming request body:', JSON.stringify(req.body));
            const { agentId, question, conversationId: providedConvId } = req.body as {
                agentId: string;
                question: string;
                conversationId?: string
            };

            if (!agentId || !question) {
                return reply.status(400).send({ error: 'agentId and question are required' });
            }

            // 1. Resolve workspaceId from agentId
            console.log(`[RAG Chat] Looking up agent: ${agentId}`);
            const agentLookup = await pool.query(
                'SELECT workspace_id FROM agents WHERE id = $1',
                [agentId]
            );

            if (agentLookup.rows.length === 0) {
                console.log(`[RAG Chat] Agent not found: ${agentId}`);
                return reply.status(404).send({ error: 'Agent not found' });
            }

            const workspaceId = agentLookup.rows[0].workspace_id;
            console.log(`[RAG Chat] Found workspace: ${workspaceId}`);

            const conversationId = (providedConvId && providedConvId.length === 36) ? providedConvId : crypto.randomUUID();
            console.log(`[RAG Chat] Using conversationId: ${conversationId}`);

            // 2. Resolve AI response with local markers
            console.log('Searching with agentId:', agentId);
            const aiResponse = await enhancedRAGService.resolveAIResponse(workspaceId, conversationId, question);
            console.log('Results found (from sources):', aiResponse.sources.length);

            console.log(`[RAG Chat] Success! Response length: ${aiResponse.content.length}`);
            console.log(`[RAG Chat] Chunks used: ${aiResponse.sources.length}`);
            return reply.send(aiResponse);

        } catch (error: any) {
            let details = error.message || '';
            if (error instanceof AggregateError) {
                details = error.errors.map((e: any) => e.message).join('; ');
            }

            console.error('[RAG Chat] CRITICAL ERROR:', {
                message: error.message,
                details,
                stack: error.stack,
                errors: error.errors
            });

            return reply.status(500).send({
                error: 'Internal Server Error (Captured)',
                answer: 'Internal Server Error (Captured): ' + details,
                details: details || 'Connection refused or dependency failure',
                stack: error.stack?.split('\n')[0],
                full_error: process.env.NODE_ENV === 'production' ? undefined : error
            });
        }
    });



    // LEGACY: Original endpoints (preserved)
    // ============================================================

    /**
     * POST /knowledge/upload
     * Original text/content upload (preserved for backward compatibility)
     */
    app.post('/upload', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        const { agentId, type, content } = addSourceSchema.parse(req.body);
        const user = (req as any).user as { workspaceId: string };
        const result = await knowledgeService.addSource(user.workspaceId, agentId, type, content);
        return reply.status(201).send({ success: true, data: result });
    });

    /**
     * GET /knowledge/:agentId
     * Get all knowledge sources for an agent
     */
    app.get('/:agentId', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        const { agentId } = req.params as { agentId: string };
        const sources = await knowledgeService.getSources(agentId);
        return reply.send({ success: true, data: sources });
    });


    // ============================================================
    // NEW: Website URL Scraping
    // ============================================================

    /**
     * POST /knowledge/website
     * Add a website URL to scrape and index
     */
    app.post('/website', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { agentId, url, name, mode } = websiteSchema.parse(req.body);

            const source = await websiteService.addWebsiteSource(agentId, url, name, mode);
            return reply.status(201).send({
                success: true,
                data: source,
                sourceId: source.id,
                status: source.status,
                message: 'Website scraping started. Check status with /knowledge/sources/:id/status'
            });
        } catch (error: any) {
            if (error.issues && error.issues.length > 0) {
                // Zod validation error — return the actual human readable message
                return reply.status(400).send({ success: false, error: { message: error.issues[0].message, details: error.issues } });
            }
            return reply.status(400).send({ success: false, error: { message: error.message || String(error) } });
        }
    });

    // ============================================================
    // NEW: Manual Q&A
    // ============================================================

    /**
     * POST /knowledge/manual-qna
     * Create a new Manual Q&A knowledge source container
     */
    app.post('/manual-qna', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { agentId, name } = createQnASourceSchema.parse(req.body);
            const source = await qnaService.createQnASource(agentId, name);
            return reply.status(201).send({ success: true, data: source });
        } catch (error: any) {
            return reply.status(400).send({ success: false, error: { message: error.message } });
        }
    });

    /**
     * POST /knowledge/qna
     * Add a single Q&A pair to a source
     */
    app.post('/qna', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { sourceId, question, answer, category, language } = addQnAPairSchema.parse(req.body);
            const qna = await qnaService.addQnAPair(sourceId, question, answer, category, language);
            return reply.status(201).send({ success: true, data: qna, message: 'Q&A pair added' });
        } catch (error: any) {
            return reply.status(400).send({ success: false, error: { message: error.message } });
        }
    });

    /**
     * GET /knowledge/qna/:sourceId
     * Get all Q&A pairs for a knowledge source
     */
    app.get('/qna/:sourceId', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { sourceId } = req.params as { sourceId: string };
            const pairs = await qnaService.getQnAPairs(sourceId);
            return reply.send({ success: true, data: pairs });
        } catch (error: any) {
            return reply.status(500).send({ success: false, error: { message: error.message } });
        }
    });

    /**
     * PUT /knowledge/qna/:qnaId
     * Update a Q&A pair
     */
    app.put('/qna/:qnaId', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { qnaId } = req.params as { qnaId: string };
            const updates = updateQnAPairSchema.parse(req.body);
            const qna = await qnaService.updateQnAPair(qnaId, updates);
            return reply.send({ success: true, data: qna, message: 'Q&A pair updated' });
        } catch (error: any) {
            return reply.status(400).send({ success: false, error: { message: error.message } });
        }
    });

    /**
     * DELETE /knowledge/qna/:qnaId
     * Delete a Q&A pair
     */
    app.delete('/qna/:qnaId', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { qnaId } = req.params as { qnaId: string };
            await qnaService.deleteQnAPair(qnaId);
            return reply.send({ success: true, message: 'Q&A pair deleted' });
        } catch (error: any) {
            return reply.status(400).send({ success: false, error: { message: error.message } });
        }
    });

    // ============================================================
    // NEW: CSV Import
    // ============================================================

    /**
     * POST /knowledge/csv-import
     * Upload a CSV file to bulk-import Q&A pairs
     * Expects multipart form: file (CSV) + agentId + name (optional)
     */
    app.post('/csv-import', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            // For multipart, we expect the body to contain the CSV as raw text
            // or the frontend to send JSON with csvContent
            const body = req.body as any;
            const { agentId, name } = csvImportSchema.parse(body);

            // Support both file content (base64) or raw CSV text
            const csvContent = body.csvContent || body.fileContent;
            if (!csvContent) {
                return reply.status(400).send({
                    success: false,
                    error: { message: 'Missing csvContent field. Send CSV content as text.' }
                });
            }

            const csvBuffer = Buffer.from(csvContent, typeof csvContent === 'string' && csvContent.includes('base64') ? 'base64' : 'utf-8');
            const result = await csvService.importFromCSV(agentId, csvBuffer, name);

            return reply.status(201).send({
                success: true,
                data: result,
                message: `Imported ${result.imported} Q&A pairs from CSV`
            });
        } catch (error: any) {
            return reply.status(400).send({ success: false, error: { message: error.message } });
        }
    });

    /**
     * GET /knowledge/csv-template
     * Download a sample CSV template
     */
    app.get('/csv-template', async (_req: FastifyRequest, reply: FastifyReply) => {
        const template = csvService.generateTemplate();
        return reply
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', 'attachment; filename=qna-template.csv')
            .send(template);
    });

    // ============================================================
    // NEW: Zendesk Integration
    // ============================================================

    /**
     * POST /knowledge/zendesk
     * Import articles from a Zendesk Help Center
     */
    app.post('/zendesk', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { agentId, subdomain, email, apiToken } = zendeskSchema.parse(req.body);
            const result = await zendeskService.importFromZendesk(agentId, subdomain, email, apiToken);
            return reply.status(201).send({
                success: true,
                data: result,
                message: `Imported ${result.imported} articles from Zendesk`
            });
        } catch (error: any) {
            return reply.status(400).send({ success: false, error: { message: error.message } });
        }
    });

    // ============================================================
    // NEW: Source Management
    // ============================================================

    /**
     * GET /knowledge/sources
     * List all knowledge sources (with optional agentId filter)
     */
    app.get('/sources', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { agentId } = req.query as { agentId?: string };
            const user = (req as any).user as { workspaceId: string };

            let queryText: string;
            let params: any[];

            if (agentId) {
                queryText = `
                    SELECT ks.*,
                           COALESCE(wp.count, 0) as website_pages_count,
                           COALESCE(qp.count, 0) as qna_count,
                           COALESCE(kv.count, 0) as vectors_count
                    FROM knowledge_sources ks
                    LEFT JOIN (
                        SELECT knowledge_source_id, COUNT(*) as count 
                        FROM website_pages 
                        GROUP BY knowledge_source_id
                    ) wp ON wp.knowledge_source_id = ks.id
                    LEFT JOIN (
                        SELECT knowledge_source_id, COUNT(*) as count 
                        FROM qna_pairs 
                        GROUP BY knowledge_source_id
                    ) qp ON qp.knowledge_source_id = ks.id
                    LEFT JOIN (
                        SELECT source_id, COUNT(*) as count 
                        FROM knowledge_vectors 
                        GROUP BY source_id
                    ) kv ON kv.source_id = ks.id
                    WHERE ks.agent_id = $1
                    ORDER BY ks.created_at DESC`;
                params = [agentId];
            } else {
                queryText = `
                    SELECT ks.*,
                           COALESCE(wp.count, 0) as website_pages_count,
                           COALESCE(qp.count, 0) as qna_count,
                           COALESCE(kv.count, 0) as vectors_count
                    FROM knowledge_sources ks
                    LEFT JOIN (
                        SELECT knowledge_source_id, COUNT(*) as count 
                        FROM website_pages 
                        GROUP BY knowledge_source_id
                    ) wp ON wp.knowledge_source_id = ks.id
                    LEFT JOIN (
                        SELECT knowledge_source_id, COUNT(*) as count 
                        FROM qna_pairs 
                        GROUP BY knowledge_source_id
                    ) qp ON qp.knowledge_source_id = ks.id
                    LEFT JOIN (
                        SELECT source_id, COUNT(*) as count 
                        FROM knowledge_vectors 
                        GROUP BY source_id
                    ) kv ON kv.source_id = ks.id
                    WHERE ks.agent_id IN (SELECT id FROM agents WHERE workspace_id = $1)
                    ORDER BY ks.created_at DESC`;
                params = [user.workspaceId];
            }

            const result = await pool.query(queryText, params);
            return reply.send({ success: true, data: result.rows });
        } catch (error: any) {
            return reply.status(500).send({ success: false, error: { message: error.message } });
        }
    });

    /**
     * GET /knowledge/sources/:id
     * Get details of a specific source
     */
    app.get('/sources/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = req.params as { id: string };
            const result = await pool.query('SELECT * FROM knowledge_sources WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return reply.status(404).send({ success: false, error: { message: 'Knowledge source not found' } });
            }
            return reply.send({ success: true, data: result.rows[0] });
        } catch (error: any) {
            return reply.status(500).send({ success: false, error: { message: error.message } });
        }
    });

    /**
     * DELETE /knowledge/sources/:id
     * Delete a knowledge source and all related data (cascades)
     */
    app.delete('/sources/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = req.params as { id: string };

            // Manually delete related records to bypass missing ON DELETE CASCADE constraints
            try {
                await pool.query('UPDATE unanswered_questions SET resolved_with = NULL WHERE resolved_with = $1', [id]);
            } catch (err: any) {
                // Ignore "relation does not exist" if migration 012 hasn't run
                if (err.code !== '42P01') throw err;
            }
            await pool.query('DELETE FROM processing_jobs WHERE knowledge_source_id = $1', [id]);
            await pool.query('DELETE FROM knowledge_vectors WHERE source_id = $1', [id]);
            await pool.query('DELETE FROM website_pages WHERE knowledge_source_id = $1', [id]);
            await pool.query('DELETE FROM qna_pairs WHERE knowledge_source_id = $1', [id]);

            // Delete the parent source
            await pool.query('DELETE FROM knowledge_sources WHERE id = $1', [id]);
            return reply.send({ success: true, message: 'Knowledge source deleted' });
        } catch (error: any) {
            import('fs').then(fs => fs.writeFileSync('last_delete_error.log', JSON.stringify({
                message: error.message,
                stack: error.stack,
                code: error.code
            }, null, 2)));
            console.error('[DELETE /sources/:id] Error deleting source:', error);
            return reply.status(500).send({ success: false, error: { message: error.message } });
        }
    });

    /**
     * GET /knowledge/sources/:id/status
     * Get the processing job status for a knowledge source
     */
    app.get('/sources/:id/status', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = req.params as { id: string };
            const result = await pool.query(
                `SELECT * FROM processing_jobs
                 WHERE knowledge_source_id = $1
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [id]
            );
            return reply.send({ success: true, data: result.rows[0] || null });
        } catch (error: any) {
            return reply.status(500).send({ success: false, error: { message: error.message } });
        }
    });

    /**
     * GET /knowledge/sources/:id/pages
     * Get all website pages for a knowledge source
     */
    app.get('/sources/:id/pages', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = req.params as { id: string };
            const result = await pool.query(
                `SELECT id, url, title, word_count, priority_score, last_crawled_at, created_at
                 FROM website_pages
                 WHERE knowledge_source_id = $1
                 ORDER BY priority_score DESC, created_at DESC`,
                [id]
            );
            return reply.send({ success: true, data: result.rows });
        } catch (error: any) {
            return reply.status(500).send({ success: false, error: { message: error.message } });
        }
    });

    /**
     * DELETE /knowledge/pages/:pageId
     * Delete a specific website page
     */
    app.delete('/pages/:pageId', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { pageId } = req.params as { pageId: string };

            // Also delete associated vectors
            await pool.query('DELETE FROM knowledge_vectors WHERE page_id = $1', [pageId]);
            await pool.query('DELETE FROM website_pages WHERE id = $1', [pageId]);

            return reply.send({ success: true, message: 'Page deleted' });
        } catch (error: any) {
            return reply.status(500).send({ success: false, error: { message: error.message } });
        }
    });
    // Internal scrape trigger — no auth needed
    app.post('/scrape-internal', async (req: FastifyRequest, reply: FastifyReply) => {
        const { sourceId, agentId } = req.body as any;
        if (!sourceId || !agentId) {
            return reply.code(400).send({ error: 'sourceId and agentId required' });
        }
        const sourceResult = await pool.query(
            'SELECT * FROM knowledge_sources WHERE id = $1 AND agent_id = $2',
            [sourceId, agentId]
        );
        if (!sourceResult.rows.length) {
            return reply.code(404).send({ error: 'Source not found' });
        }
        const source = sourceResult.rows[0];
        websiteService.scrapePriorityPages(sourceId, source.url)
            .then(() => console.log(`✅ Done scraping ${source.url}`))
            .catch((err: any) => console.error(`❌ Scrape failed: ${err.message}`));
        return reply.send({ success: true, message: `Scraping started for ${source.url}` });
    });
}
