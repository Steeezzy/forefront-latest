import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { InboxService, createConversationSchema, createMessageSchema, updateConversationSchema } from './inbox.service.js';
import { authenticate } from '../auth/auth.middleware.js';

const inboxService = new InboxService();

export async function inboxRoutes(fastify: FastifyInstance) {
  // All inbox routes require authentication
  fastify.addHook('onRequest', authenticate);
  
  // Get conversations list
  fastify.get('/conversations', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      const userId = request.user?.userId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const query = request.query as Record<string, any>;
      
      const filters = {
        status: query.status,
        assignedTo: query.assigned_to === 'me' ? userId : query.assigned_to,
        channel: query.channel,
        search: query.search,
        tags: query.tags?.split(','),
        priority: query.priority,
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 20,
      };
      
      const result = await inboxService.getConversations(workspaceId, filters);
      
      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Get single conversation with messages
  fastify.get('/conversations/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const [conversation, messages] = await Promise.all([
        inboxService.getConversationById(request.params.id, workspaceId),
        inboxService.getMessages(request.params.id, workspaceId),
      ]);
      
      if (!conversation) {
        return reply.code(404).send({ error: 'Conversation not found' });
      }
      
      return reply.send({
        success: true,
        data: { conversation, messages },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Update conversation
  fastify.patch('/conversations/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const data = updateConversationSchema.parse(request.body);
      const conversation = await inboxService.updateConversation(request.params.id, workspaceId, data);
      
      return reply.send({
        success: true,
        data: conversation,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Send message
  fastify.post('/conversations/:id/messages', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      const userId = request.user?.userId;
      
      if (!workspaceId || !userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const data = createMessageSchema.parse({
        ...request.body as object,
        conversationId: request.params.id,
        senderType: 'agent',
        senderId: userId,
      });
      
      const message = await inboxService.addMessage(data);
      
      return reply.send({
        success: true,
        data: message,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Assign conversation
  fastify.post('/conversations/:id/assign', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      const userId = request.user?.userId;
      
      if (!workspaceId || !userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const { assigned_to } = request.body as { assigned_to: string | null };
      const conversation = await inboxService.assignConversation(
        request.params.id,
        workspaceId,
        assigned_to,
        userId
      );
      
      return reply.send({
        success: true,
        data: conversation,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Mark as read
  fastify.post('/conversations/:id/read', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      const userId = request.user?.userId;
      
      if (!workspaceId || !userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      await inboxService.markMessagesAsRead(request.params.id, userId);
      
      return reply.send({
        success: true,
        message: 'Marked as read',
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Get conversation stats
  fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const stats = await inboxService.getConversationStats(workspaceId);
      
      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
}
