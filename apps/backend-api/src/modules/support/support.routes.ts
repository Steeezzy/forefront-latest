import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../auth/auth.middleware.js';
import { SupportService } from './support.service.js';

const supportService = new SupportService();

export async function supportRoutes(app: FastifyInstance) {
  // All support routes require internal staff authentication
  app.addHook('onRequest', authenticate);

  // ─── Dashboard ────────────────────────────────────────────────────────────

  app.get('/stats', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await supportService.getDashboardStats();
      return reply.send({ success: true, data: stats });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // ─── Tickets ──────────────────────────────────────────────────────────────

  app.get('/tickets', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = req.query as Record<string, string>;
      const tickets = await supportService.listTickets({
        status: query.status,
        priority: query.priority,
        assignedTo: query.assignedTo,
        search: query.search,
      });
      return reply.send({ success: true, data: tickets });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  app.get(
    '/tickets/:id',
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const ticket = await supportService.getTicket(req.params.id);
        if (!ticket) return reply.code(404).send({ success: false, error: 'Ticket not found' });
        return reply.send({ success: true, data: ticket });
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message });
      }
    }
  );

  app.post(
    '/tickets/:id/reply',
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: { content: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { content } = req.body;
        if (!content?.trim()) {
          return reply.code(400).send({ success: false, error: 'content is required' });
        }
        const agentName = (req as any).user?.name || 'Support Agent';
        await supportService.addMessage(req.params.id, 'agent', content, agentName);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message });
      }
    }
  );

  app.post(
    '/tickets/:id/note',
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: { content: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { content } = req.body;
        if (!content?.trim()) {
          return reply.code(400).send({ success: false, error: 'content is required' });
        }
        const agentName = (req as any).user?.name || 'Support Agent';
        await supportService.addInternalNote(req.params.id, agentName, content);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message });
      }
    }
  );

  app.patch(
    '/tickets/:id/status',
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { status } = req.body;
        const validStatuses = ['open', 'pending', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
          return reply.code(400).send({ success: false, error: `status must be one of: ${validStatuses.join(', ')}` });
        }
        await supportService.updateStatus(req.params.id, status);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message });
      }
    }
  );

  app.patch(
    '/tickets/:id/assign',
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: { agentId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { agentId } = req.body;
        if (!agentId) {
          return reply.code(400).send({ success: false, error: 'agentId is required' });
        }
        await supportService.assignTicket(req.params.id, agentId);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message });
      }
    }
  );

  // ─── Onboarding Flows ─────────────────────────────────────────────────────

  app.get('/flows', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const flows = await supportService.listFlows();
      return reply.send({ success: true, data: flows });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  app.post(
    '/flows',
    async (
      req: FastifyRequest<{
        Body: { name: string; autoTrigger?: boolean; steps?: any[] };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { name, autoTrigger = false, steps = [] } = req.body;
        if (!name?.trim()) {
          return reply.code(400).send({ success: false, error: 'name is required' });
        }
        const flow = await supportService.createFlow(name, autoTrigger, steps);
        return reply.code(201).send({ success: true, data: flow });
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message });
      }
    }
  );

  app.patch(
    '/flows/:id',
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: { name?: string; auto_trigger?: boolean; steps?: any[] };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { name, auto_trigger, steps } = req.body;
        const flow = await supportService.updateFlow(req.params.id, { name, auto_trigger, steps });
        if (!flow) return reply.code(404).send({ success: false, error: 'Flow not found' });
        return reply.send({ success: true, data: flow });
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message });
      }
    }
  );

  app.delete(
    '/flows/:id',
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await supportService.deleteFlow(req.params.id);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: error.message });
      }
    }
  );
}
