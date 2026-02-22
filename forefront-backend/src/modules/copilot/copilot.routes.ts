import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { enhancedRAGService } from '../chat/enhanced-rag.service.js';
import { authenticate } from '../auth/auth.middleware.js';

export async function copilotRoutes(fastify: FastifyInstance) {
  // All copilot routes require authentication
  fastify.addHook('onRequest', authenticate);
  
  // Get reply suggestions
  fastify.get('/suggest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      const query = request.query as Record<string, string>;
      const { conversationId } = query;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      if (!conversationId) {
        return reply.code(400).send({ error: 'Conversation ID is required' });
      }
      
      const suggestions = await enhancedRAGService.suggestReplies(conversationId, workspaceId);
      
      return reply.send({
        success: true,
        data: { suggestions },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Rewrite draft
  fastify.post('/rewrite', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const { draft, tone } = request.body as { draft: string; tone?: string };
      
      if (!draft) {
        return reply.code(400).send({ error: 'Draft is required' });
      }
      
      const rewritten = await enhancedRAGService.rewriteDraft(draft, tone);
      
      return reply.send({
        success: true,
        data: { rewritten },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
}
