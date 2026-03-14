/**
 * Conversa AI Routes — Chat, sessions, handoffs, and guardrail management.
 *
 * @route POST   /api/conversa/chat              — AI chat with RAG pipeline
 * @route GET    /api/conversa/sessions/:id       — get session
 * @route DELETE /api/conversa/sessions/:id       — clear session
 * @route GET    /api/conversa/handoffs           — pending handoffs
 * @route PUT    /api/conversa/handoffs/:id/accept  — accept handoff
 * @route PUT    /api/conversa/handoffs/:id/resolve — resolve handoff
 * @route GET    /api/conversa/guardrail-rules    — list rules
 * @route POST   /api/conversa/guardrail-rules    — create rule
 * @route PUT    /api/conversa/guardrail-rules/:id — update rule
 * @route DELETE /api/conversa/guardrail-rules/:id — delete rule
 * @security JWT
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware.js';
import { ConversaService } from '../../services/rag/ConversaService.js';
import { HandoffService } from '../../services/rag/HandoffService.js';
import { GuardrailsService } from '../../services/rag/GuardrailsService.js';

const conversaService = new ConversaService();
const handoffService = new HandoffService();
const guardrailsService = new GuardrailsService();

export async function conversaRoutes(app: FastifyInstance) {
    app.addHook('onRequest', authenticate);

    // ─── Chat ──────────────────────────────────────────────────────────

    app.post('/chat', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const body = z.object({
                message: z.string().min(1).max(5000),
                session_id: z.string().uuid(),
                conversation_id: z.string().uuid(),
                contact_id: z.string().uuid().optional(),
            }).parse(req.body);

            const response = await conversaService.chat({
                ...body,
                workspace_id: workspaceId,
            });

            return reply.send({ success: true, data: response });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    // ─── Sessions ──────────────────────────────────────────────────────

    app.get('/sessions/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const session = await conversaService.getSession(id);
            if (!session) return reply.code(404).send({ error: 'Session not found' });
            return reply.send({ success: true, data: session });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    app.delete('/sessions/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            await conversaService.clearSession(id);
            return reply.send({ success: true, message: 'Session cleared' });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    // ─── Handoffs ──────────────────────────────────────────────────────

    app.get('/handoffs', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });
            const handoffs = await handoffService.getPendingHandoffs(workspaceId);
            return reply.send({ success: true, data: { handoffs } });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    app.put('/handoffs/:id/accept', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const { agent_id } = z.object({ agent_id: z.string().uuid() }).parse(req.body);
            const handoff = await handoffService.acceptHandoff(id, agent_id);
            return reply.send({ success: true, data: handoff });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    app.put('/handoffs/:id/resolve', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const handoff = await handoffService.resolveHandoff(id);
            return reply.send({ success: true, data: handoff });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    // ─── Guardrail Rules ───────────────────────────────────────────────

    app.get('/guardrail-rules', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });
            const rules = await guardrailsService.loadRules(workspaceId);
            return reply.send({ success: true, data: { rules } });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    app.post('/guardrail-rules', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const body = z.object({
                name: z.string().min(1).max(255),
                type: z.enum(['topic_block', 'keyword_filter', 'pii_detection', 'confidence_gate', 'custom_regex']),
                config: z.record(z.string(), z.any()),
                action: z.enum(['allow', 'block', 'rephrase', 'handoff']).default('block'),
                priority: z.number().int().default(0),
                enabled: z.boolean().default(true),
            }).parse(req.body);

            const rule = await guardrailsService.createRule({ ...body, workspace_id: workspaceId });
            return reply.code(201).send({ success: true, data: rule });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    app.put('/guardrail-rules/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const updates = z.object({
                name: z.string().optional(),
                type: z.enum(['topic_block', 'keyword_filter', 'pii_detection', 'confidence_gate', 'custom_regex']).optional(),
                config: z.record(z.string(), z.any()).optional(),
                action: z.enum(['allow', 'block', 'rephrase', 'handoff']).optional(),
                priority: z.number().int().optional(),
                enabled: z.boolean().optional(),
            }).parse(req.body);

            const rule = await guardrailsService.updateRule(id, updates);
            return reply.send({ success: true, data: rule });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    app.delete('/guardrail-rules/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            await guardrailsService.deleteRule(id);
            return reply.send({ success: true, message: 'Rule deleted' });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });
}
