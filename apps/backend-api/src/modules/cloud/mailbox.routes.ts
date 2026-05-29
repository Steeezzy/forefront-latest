/**
 * Cloud Mailbox Routes
 *
 * @route GET    /api/cloud/mailboxes         — list all mailboxes
 * @route POST   /api/cloud/mailboxes         — create a mailbox
 * @route GET    /api/cloud/mailboxes/stats   — storage stats
 * @route GET    /api/cloud/mailboxes/:id     — get single mailbox
 * @route DELETE /api/cloud/mailboxes/:id     — delete mailbox
 * @security JWT
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware.js';
import { MailboxService } from './mailbox.service.js';

const mailboxService = new MailboxService();

const createMailboxSchema = z.object({
  localPart: z.string().min(1).max(64).regex(/^[a-z0-9._+-]+$/i, 'Invalid local part'),
  domain: z.string().min(1),
  displayName: z.string().min(1).max(128),
  password: z.string().min(8),
  storageLimitGb: z.number().positive().default(5),
});

export async function mailboxRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ─── List Mailboxes ────────────────────────────────────────────────────

  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const mailboxes = await mailboxService.listMailboxes(workspaceId);
      return reply.send({ success: true, data: mailboxes });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // ─── Storage Stats ─────────────────────────────────────────────────────

  app.get('/stats', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const stats = await mailboxService.getStorageStats(workspaceId);
      return reply.send({ success: true, data: stats });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // ─── Get Single Mailbox ────────────────────────────────────────────────

  app.get('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      const mailbox = await mailboxService.getMailboxById(workspaceId, id);
      if (!mailbox) return reply.code(404).send({ success: false, error: 'Mailbox not found' });

      return reply.send({ success: true, data: mailbox });
    } catch (error: any) {
      const code = error.message.includes('not found') ? 404 : 400;
      return reply.code(code).send({ success: false, error: error.message });
    }
  });

  // ─── Create Mailbox ────────────────────────────────────────────────────

  app.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const data = createMailboxSchema.parse(req.body);
      const mailbox = await mailboxService.createMailbox(workspaceId, data);

      return reply.code(201).send({ success: true, data: mailbox });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ success: false, error: 'Validation failed', details: error.errors });
      }
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // ─── Delete Mailbox ────────────────────────────────────────────────────

  app.delete('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      await mailboxService.deleteMailbox(workspaceId, id);

      return reply.code(200).send({ success: true, message: 'Mailbox deleted' });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });
}
