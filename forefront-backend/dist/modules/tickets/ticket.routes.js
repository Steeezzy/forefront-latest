/**
 * Ticket Routes — RESTful API for the ticketing system.
 *
 * @route GET    /api/tickets          — list with filtering
 * @route POST   /api/tickets          — create ticket
 * @route GET    /api/tickets/stats    — dashboard metrics
 * @route GET    /api/tickets/:id      — detail with comments
 * @route PATCH  /api/tickets/:id      — update status/priority/tags
 * @route POST   /api/tickets/:id/assign   — assign to agent
 * @route POST   /api/tickets/:id/comments — add comment/note
 * @route POST   /api/tickets/:id/resolve  — resolve
 * @route POST   /api/tickets/from-conversation — convert conversation to ticket
 * @security JWT
 */
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware.js';
import { TicketService, createTicketSchema, updateTicketSchema, addCommentSchema, } from './ticket.service.js';
const ticketService = new TicketService();
export async function ticketRoutes(app) {
    // All ticket routes require authentication
    app.addHook('onRequest', authenticate);
    // ─── List Tickets ──────────────────────────────────────────────────
    app.get('/', async (req, reply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const query = req.query;
            const filters = {
                status: query.status,
                priority: query.priority,
                assigned_to: query.assigned_to === 'me' ? req.user?.userId : query.assigned_to,
                source: query.source,
                tags: query.tags?.split(','),
                search: query.search,
                page: parseInt(query.page) || 1,
                limit: parseInt(query.limit) || 20,
                sort_by: query.sort_by,
                sort_order: query.sort_order,
            };
            const result = await ticketService.getTickets(workspaceId, filters);
            return reply.send({ success: true, data: result });
        }
        catch (error) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });
    // ─── Create Ticket ─────────────────────────────────────────────────
    app.post('/', async (req, reply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const data = createTicketSchema.parse({
                ...req.body,
                workspace_id: workspaceId,
            });
            const ticket = await ticketService.createTicket(data);
            return reply.code(201).send({ success: true, data: ticket });
        }
        catch (error) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });
    // ─── Ticket Stats ──────────────────────────────────────────────────
    app.get('/stats', async (req, reply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const stats = await ticketService.getTicketStats(workspaceId);
            return reply.send({ success: true, data: stats });
        }
        catch (error) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });
    // ─── Get Single Ticket ─────────────────────────────────────────────
    app.get('/:id', async (req, reply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const result = await ticketService.getTicketById(id, workspaceId);
            if (!result)
                return reply.code(404).send({ error: 'Ticket not found' });
            return reply.send({ success: true, data: result });
        }
        catch (error) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });
    // ─── Update Ticket ─────────────────────────────────────────────────
    app.patch('/:id', async (req, reply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const data = updateTicketSchema.parse(req.body);
            const ticket = await ticketService.updateTicket(id, workspaceId, data);
            return reply.send({ success: true, data: ticket });
        }
        catch (error) {
            const code = error.message.includes('not found') ? 404 : 400;
            return reply.code(code).send({ success: false, error: error.message });
        }
    });
    // ─── Assign Ticket ─────────────────────────────────────────────────
    app.post('/:id/assign', async (req, reply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            const userId = req.user?.userId;
            if (!workspaceId || !userId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const { assigned_to } = z.object({
                assigned_to: z.string().uuid().nullable(),
            }).parse(req.body);
            const ticket = await ticketService.assignTicket(id, workspaceId, assigned_to, userId);
            return reply.send({ success: true, data: ticket });
        }
        catch (error) {
            const code = error.message.includes('not found') ? 404 : 400;
            return reply.code(code).send({ success: false, error: error.message });
        }
    });
    // ─── Add Comment ───────────────────────────────────────────────────
    app.post('/:id/comments', async (req, reply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            const userId = req.user?.userId;
            if (!workspaceId || !userId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const body = req.body;
            const data = addCommentSchema.parse({
                ticket_id: id,
                author_type: 'agent',
                author_id: userId,
                author_name: body.author_name,
                content: body.content,
                is_internal: body.is_internal ?? false,
            });
            const comment = await ticketService.addComment(data);
            return reply.code(201).send({ success: true, data: comment });
        }
        catch (error) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });
    // ─── Resolve Ticket ────────────────────────────────────────────────
    app.post('/:id/resolve', async (req, reply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            const userId = req.user?.userId;
            if (!workspaceId || !userId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const ticket = await ticketService.resolveTicket(id, workspaceId, userId);
            return reply.send({ success: true, data: ticket, message: 'Ticket resolved' });
        }
        catch (error) {
            const code = error.message.includes('Invalid status') ? 409 : 400;
            return reply.code(code).send({ success: false, error: error.message });
        }
    });
    // ─── Convert Conversation to Ticket ────────────────────────────────
    app.post('/from-conversation', async (req, reply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            const userId = req.user?.userId;
            if (!workspaceId || !userId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { conversation_id, subject } = z.object({
                conversation_id: z.string().uuid(),
                subject: z.string().min(1).max(500),
            }).parse(req.body);
            const ticket = await ticketService.convertConversationToTicket(conversation_id, workspaceId, subject, userId);
            return reply.code(201).send({ success: true, data: ticket });
        }
        catch (error) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });
}
//# sourceMappingURL=ticket.routes.js.map