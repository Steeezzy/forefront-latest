import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware.js';
import { KnowledgeService } from './knowledge.service.js';
import { ManualQnAService } from '../../services/ManualQnAService.js';
import { WebsiteScrapingService } from '../../services/WebsiteScrapingService.js';
import { CSVImportService } from '../../services/CSVImportService.js';
import { ZendeskService } from '../../services/ZendeskService.js';
import { pool } from '../../config/db.js';

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
    // RAG Chat — Test Lyro endpoint
    // ============================================================

    /**
     * POST /knowledge/chat
     * RAG-powered question answering against the knowledge base
     */
    app.post('/chat', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { agentId, question } = req.body as { agentId: string; question: string };

            if (!agentId || !question) {
                return reply.status(400).send({ error: 'agentId and question are required' });
            }

            console.log(`[RAG Chat] Agent: ${agentId}, Question: "${question}"`);

            let relevantChunks: any[] = [];

            // Try vector search first
            try {
                const { generateEmbedding } = await import('../../utils/embeddings.js');
                const questionEmbedding = await generateEmbedding(question);
                const embeddingStr = `[${questionEmbedding.join(',')}]`;

                console.log(`[RAG Chat] Embedding generated, length: ${questionEmbedding.length}`);

                const vectorResult = await pool.query(
                    `SELECT kv.content_chunk, kv.source_id,
                            ks.name as source_name, ks.url as source_url,
                            1 - (kv.embedding <=> $1::vector) AS similarity
                     FROM knowledge_vectors kv
                     JOIN knowledge_sources ks ON ks.id = kv.source_id
                     WHERE ks.agent_id = $2
                     ORDER BY kv.embedding <=> $1::vector
                     LIMIT 5`,
                    [embeddingStr, agentId]
                );

                relevantChunks = vectorResult.rows;
                console.log(`[RAG Chat] Vector search found ${relevantChunks.length} chunks`);
            } catch (embErr: any) {
                console.error(`[RAG Chat] Vector search failed:`, embErr.message);

                // Fallback: text-based search using ILIKE
                console.log(`[RAG Chat] Falling back to text search...`);
                const keywords = question.split(/\s+/).filter(w => w.length > 3).slice(0, 3);
                if (keywords.length > 0) {
                    const pattern = `%${keywords.join('%')}%`;
                    const textResult = await pool.query(
                        `SELECT kv.content_chunk, kv.source_id,
                                ks.name as source_name, ks.url as source_url,
                                0.5 AS similarity
                         FROM knowledge_vectors kv
                         JOIN knowledge_sources ks ON ks.id = kv.source_id
                         WHERE ks.agent_id = $1
                           AND kv.content_chunk ILIKE $2
                         LIMIT 5`,
                        [agentId, pattern]
                    );
                    relevantChunks = textResult.rows;
                    console.log(`[RAG Chat] Text search found ${relevantChunks.length} chunks`);
                }
            }

            // Also search Q&A pairs
            let matchedQnA: any[] = [];
            try {
                const keywords = question.split(/\s+/).filter(w => w.length > 2).slice(0, 3);
                if (keywords.length > 0) {
                    const qnaResult = await pool.query(
                        `SELECT qp.question, qp.answer, ks.name as source_name
                         FROM qna_pairs qp
                         JOIN knowledge_sources ks ON ks.id = qp.knowledge_source_id
                         WHERE ks.agent_id = $1
                           AND (qp.question ILIKE $2 OR qp.answer ILIKE $2)
                         LIMIT 3`,
                        [agentId, `%${keywords.join('%')}%`]
                    );
                    matchedQnA = qnaResult.rows;
                }
            } catch (qnaErr: any) {
                console.log(`[RAG Chat] Q&A search skipped: ${qnaErr.message}`);
            }

            // Build context
            let context = '';

            if (relevantChunks.length > 0) {
                context += 'RELEVANT KNOWLEDGE BASE CONTENT:\n';
                for (const chunk of relevantChunks) {
                    context += `---\n[Source: ${chunk.source_name || 'Website'}]\n${chunk.content_chunk}\n`;
                }
            }

            if (matchedQnA.length > 0) {
                context += '\nRELEVANT Q&A PAIRS:\n';
                for (const qa of matchedQnA) {
                    context += `Q: ${qa.question}\nA: ${qa.answer}\n---\n`;
                }
            }

            console.log(`[RAG Chat] Context length: ${context.length}, chunks: ${relevantChunks.length}, qna: ${matchedQnA.length}`);

            // Generate answer
            const apiKey = process.env.SARVAM_API_KEY;
            const sourceNames = [...new Set(relevantChunks.map(c => c.source_name || c.source_url).filter(Boolean))];
            let answer: string;

            if (!context.trim()) {
                answer = "I don't have enough knowledge to answer that question yet. Try importing more content to your knowledge base!";
            } else if (apiKey) {
                const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: 'sarvam-m',
                        messages: [
                            {
                                role: 'user',
                                content: `You are a concise, friendly AI support agent. Answer based on the knowledge base content below.

RULES:
- Keep answers SHORT — 2-3 sentences max unless the user asks for details
- Be conversational and natural, like a real support chat agent
- No markdown formatting, no headers, no bold text — just plain text
- Only use bullet points if listing 4+ items, and keep each bullet to a few words
- If you don't have the info, say so briefly and move on
- Never say "based on the provided content" or reference the knowledge base directly

KNOWLEDGE BASE:
${context}

Customer: ${question}

Reply briefly:`
                            }
                        ],
                        max_tokens: 300,
                        temperature: 0.5,
                    }),
                });

                if (response.ok) {
                    const data: any = await response.json();
                    answer = data.choices?.[0]?.message?.content?.trim() || "I couldn't generate a response.";
                } else {
                    const errText = await response.text();
                    console.error('[RAG Chat] Sarvam API error:', errText);
                    answer = "I'm having trouble connecting to my AI brain right now. Please try again.";
                }
            } else {
                answer = `Based on my knowledge base:\n\n${relevantChunks[0]?.content_chunk || "No matching content found."}`;
            }

            return reply.send({
                answer,
                sources: sourceNames,
                chunks_found: relevantChunks.length,
                qna_found: matchedQnA.length,
            });
        } catch (error: any) {
            console.error('[RAG Chat] Error:', error);
            return reply.status(500).send({ error: error.message });
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
                message: 'Website scraping started. Check status with /knowledge/sources/:id/status'
            });
        } catch (error: any) {
            if (error.issues) {
                // Zod validation error
            }
            return reply.status(400).send({ success: false, error: { message: error.message } });
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
                           (SELECT COUNT(*) FROM website_pages wp WHERE wp.knowledge_source_id = ks.id) as website_pages_count,
                           (SELECT COUNT(*) FROM qna_pairs qp WHERE qp.knowledge_source_id = ks.id) as qna_count,
                           (SELECT COUNT(*) FROM knowledge_vectors kv WHERE kv.source_id = ks.id) as vectors_count
                    FROM knowledge_sources ks
                    WHERE ks.agent_id = $1
                    ORDER BY ks.created_at DESC`;
                params = [agentId];
            } else {
                queryText = `
                    SELECT ks.*,
                           (SELECT COUNT(*) FROM website_pages wp WHERE wp.knowledge_source_id = ks.id) as website_pages_count,
                           (SELECT COUNT(*) FROM qna_pairs qp WHERE qp.knowledge_source_id = ks.id) as qna_count,
                           (SELECT COUNT(*) FROM knowledge_vectors kv WHERE kv.source_id = ks.id) as vectors_count
                    FROM knowledge_sources ks
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
            await pool.query('DELETE FROM knowledge_sources WHERE id = $1', [id]);
            return reply.send({ success: true, message: 'Knowledge source deleted' });
        } catch (error: any) {
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
}
