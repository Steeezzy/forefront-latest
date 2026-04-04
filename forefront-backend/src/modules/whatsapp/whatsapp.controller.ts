import type { FastifyReply, FastifyRequest } from 'fastify';
import { whatsappModuleService } from './whatsapp.service.js';

export class WhatsAppController {
  async connect(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const body = request.body as {
        phoneNumberId: string;
        accessToken: string;
        verifyToken: string;
        businessAccountId?: string;
      };

      if (!body?.phoneNumberId || !body?.accessToken || !body?.verifyToken) {
        return reply.code(400).send({ error: 'phoneNumberId, accessToken, and verifyToken are required' });
      }

      const result = await whatsappModuleService.connect(workspaceId, body);
      return reply.send(result);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async getConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const config = await whatsappModuleService.getConfig(workspaceId);
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
        accessToken?: string;
        verifyToken?: string;
      };

      const config = await whatsappModuleService.updateConfig(workspaceId, body || {});
      return reply.send({ config });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async deleteConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const result = await whatsappModuleService.deleteConfig(workspaceId);
      return reply.send({ success: result.deleted });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async testMessage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const body = request.body as { phone: string; message: string };

      if (!body?.phone || !body?.message) {
        return reply.code(400).send({ error: 'phone and message are required' });
      }

      const result = await whatsappModuleService.sendTestMessage(workspaceId, body);
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

      const conversations = await whatsappModuleService.listConversations(workspaceId, status, page, limit);
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

      const messages = await whatsappModuleService.listMessages(workspaceId, conversationId, limit);
      return reply.send({ messages });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async sendManual(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const body = request.body as { phone: string; message: string };

      if (!body?.phone || !body?.message) {
        return reply.code(400).send({ error: 'phone and message are required' });
      }

      const result = await whatsappModuleService.manualSend(workspaceId, body);
      return reply.send(result);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }
}

export const whatsappController = new WhatsAppController();
