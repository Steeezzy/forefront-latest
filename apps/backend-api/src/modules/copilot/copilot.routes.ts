/**
 * Copilot Routes — Agent-assist API.
 *
 * @route POST /api/copilot/suggestions    — get AI suggestions for agents
 * @route POST /api/copilot/kb-search      — direct KB search from inbox
 * @route POST /api/copilot/index-document  — chunk + embed + store a document
 * @route DELETE /api/copilot/documents/:id — remove all chunks for a document
 * @security JWT
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware.js';
import { CopilotService } from '../../services/rag/CopilotService.js';
import { DocumentIngestionService } from '../../services/rag/DocumentIngestionService.js';
import { pool } from '../../config/db.js';

const copilotService = new CopilotService();

export async function copilotRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ─── Get Suggestions ───────────────────────────────────────────────

  app.post('/suggestions', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const body = z.object({
        conversation_id: z.string().uuid(),
        request_type: z.enum(['reply_draft', 'kb_search', 'tone_rephrase', 'all']),
        messages: z.array(z.object({
          role: z.enum(['system', 'user', 'assistant', 'tool']),
          content: z.string(),
          timestamp: z.string().optional(),
        })).min(1),
        draft_text: z.string().optional(),
      }).parse(req.body);

      const response = await copilotService.getSuggestions({
        workspace_id: workspaceId,
        ...body,
        messages: body.messages.map((m) => ({
          ...m,
          timestamp: m.timestamp || new Date().toISOString(),
        })),
      });

      return reply.send({ success: true, data: response });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });

  // ─── KB Search ─────────────────────────────────────────────────────

  app.post('/kb-search', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { query } = z.object({
        query: z.string().min(1).max(1000),
      }).parse(req.body);

      const suggestions = await copilotService.searchKB(query, workspaceId);
      return reply.send({ success: true, data: { suggestions } });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });

  // ─── Index Document ────────────────────────────────────────────────

  app.post('/index-document', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const body = z.object({
        kb_id: z.string().uuid(),
        document_id: z.string().uuid(),
        content: z.string().min(1),
        title: z.string().optional(),
        strategy: z.enum(['fixed_size', 'sentence', 'paragraph']).default('sentence'),
        chunk_size: z.number().default(512),
        chunk_overlap: z.number().default(50),
      }).parse(req.body);

      const ingestionService = new DocumentIngestionService();
      const result = await ingestionService.ingestDocument(
        body.kb_id,
        body.document_id,
        body.content,
        {
          strategy: body.strategy,
          chunk_size: body.chunk_size,
          chunk_overlap: body.chunk_overlap,
        }
      );

      return reply.send({ success: true, data: result });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });

  // ─── Delete Document Chunks ────────────────────────────────────────

  app.delete('/documents/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

      await pool.query(
        `DELETE FROM document_chunks WHERE document_id = $1`,
        [id]
      );

      return reply.send({ success: true, message: 'Document chunks deleted' });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });
}
