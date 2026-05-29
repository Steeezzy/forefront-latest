import type { FastifyReply, FastifyRequest } from 'fastify';
import { emailModuleService } from './email.service.js';

export class EmailController {
  async connect(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const body = request.body as {
        provider?: string;
        inboxEmail: string;
        displayName?: string;
        smtpHost?: string;
        smtpPort?: number;
        smtpUsername?: string;
        smtpPassword?: string;
        imapHost?: string;
        imapPort?: number;
        imapUsername?: string;
        imapPassword?: string;
        webhookSecret?: string;
        verifyToken: string;
      };

      if (!body?.inboxEmail || !body?.verifyToken) {
        return reply.code(400).send({ error: 'inboxEmail and verifyToken are required' });
      }

      const result = await emailModuleService.connect(workspaceId, body);
      return reply.send(result);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async getConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const config = await emailModuleService.getConfig(workspaceId);
      return reply.send({ config });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async updateConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const body = request.body as {
        enabled?: boolean;
        displayName?: string;
        smtpHost?: string;
        smtpPort?: number;
        smtpUsername?: string;
        smtpPassword?: string;
        imapHost?: string;
        imapPort?: number;
        imapUsername?: string;
        imapPassword?: string;
        webhookSecret?: string;
        verifyToken?: string;
      };

      const config = await emailModuleService.updateConfig(workspaceId, body || {});
      return reply.send({ config });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async deleteConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const result = await emailModuleService.deleteConfig(workspaceId);
      return reply.send({ success: result.deleted });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async testEmail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const body = request.body as { toEmail: string; subject: string; message: string };

      if (!body?.toEmail || !body?.subject || !body?.message) {
        return reply.code(400).send({ error: 'toEmail, subject, and message are required' });
      }

      const result = await emailModuleService.sendTestEmail(workspaceId, body);
      return reply.send(result);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async getConversations(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const query = request.query as { status?: string; page?: string; limit?: string };

      const status = query.status || 'active';
      const page = Number(query.page || 1);
      const limit = Number(query.limit || 20);

      const conversations = await emailModuleService.listConversations(workspaceId, status, page, limit);
      return reply.send({ conversations, page, limit });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async getMessages(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId, conversationId } = request.params as { workspaceId: string; conversationId: string };
      const query = request.query as { limit?: string };
      const limit = Number(query.limit || 50);

      const messages = await emailModuleService.listMessages(workspaceId, conversationId, limit);
      return reply.send({ messages });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }
}

export const emailController = new EmailController();