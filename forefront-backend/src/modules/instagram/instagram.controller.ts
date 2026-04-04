import type { FastifyReply, FastifyRequest } from 'fastify';
import { instagramModuleService } from './instagram.service.js';

export class InstagramController {
  async connect(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const body = request.body as {
        instagramAccountId: string;
        pageId: string;
        accessToken: string;
        verifyToken: string;
        instagramUsername?: string;
      };

      if (!body?.instagramAccountId || !body?.pageId || !body?.accessToken || !body?.verifyToken) {
        return reply.code(400).send({ error: 'instagramAccountId, pageId, accessToken, and verifyToken are required' });
      }

      const result = await instagramModuleService.connect(workspaceId, body);
      return reply.send(result);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async getConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const config = await instagramModuleService.getConfig(workspaceId);
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
        instagramUsername?: string;
      };

      const config = await instagramModuleService.updateConfig(workspaceId, body || {});
      return reply.send({ config });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async deleteConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const result = await instagramModuleService.deleteConfig(workspaceId);
      return reply.send({ success: result.deleted });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }

  async testDM(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const body = request.body as { recipientId: string; message: string };

      if (!body?.recipientId || !body?.message) {
        return reply.code(400).send({ error: 'recipientId and message are required' });
      }

      const result = await instagramModuleService.sendTestDM(workspaceId, body);
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

      const conversations = await instagramModuleService.listConversations(workspaceId, status, page, limit);
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

      const messages = await instagramModuleService.listMessages(workspaceId, conversationId, limit);
      return reply.send({ messages });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  }
}

export const instagramController = new InstagramController();
