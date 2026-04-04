import type { FastifyReply, FastifyRequest } from 'fastify';
import { facebookModuleService } from './facebook.service.js';

export class FacebookController {
  async connect(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const body = request.body as {
        pageId: string;
        pageAccessToken: string;
        verifyToken: string;
        appSecret?: string;
        pageName?: string;
      };

      if (!body?.pageId || !body?.pageAccessToken || !body?.verifyToken) {
        return reply.code(400).send({ error: 'pageId, pageAccessToken, and verifyToken are required' });
      }

      const result = await facebookModuleService.connect(workspaceId, body);
      return reply.send(result);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async getConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const config = await facebookModuleService.getConfig(workspaceId);
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
        pageAccessToken?: string;
        verifyToken?: string;
        appSecret?: string;
        pageName?: string;
      };

      const config = await facebookModuleService.updateConfig(workspaceId, body || {});
      return reply.send({ config });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async deleteConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const result = await facebookModuleService.deleteConfig(workspaceId);
      return reply.send({ success: result.deleted });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async testMessage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const body = request.body as { recipientId: string; message: string };

      if (!body?.recipientId || !body?.message) {
        return reply.code(400).send({ error: 'recipientId and message are required' });
      }

      const result = await facebookModuleService.sendTestMessage(workspaceId, body);
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

      const conversations = await facebookModuleService.listConversations(workspaceId, status, page, limit);
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

      const messages = await facebookModuleService.listMessages(workspaceId, conversationId, limit);
      return reply.send({ messages });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }
}

export const facebookController = new FacebookController();
