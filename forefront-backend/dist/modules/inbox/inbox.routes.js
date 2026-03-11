import { InboxService, createMessageSchema, updateConversationSchema } from './inbox.service.js';
import { authenticate } from '../auth/auth.middleware.js';
const inboxService = new InboxService();
export async function inboxRoutes(fastify) {
    // All inbox routes require authentication
    fastify.addHook('onRequest', authenticate);
    // Get conversations list
    fastify.get('/conversations', async (request, reply) => {
        try {
            const workspaceId = request.user?.workspaceId;
            const userId = request.user?.userId;
            if (!workspaceId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const query = request.query;
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
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
    // Get single conversation with messages
    fastify.get('/conversations/:id', async (request, reply) => {
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
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
    // Update conversation
    fastify.patch('/conversations/:id', async (request, reply) => {
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
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
    // Send message
    fastify.post('/conversations/:id/messages', async (request, reply) => {
        try {
            const workspaceId = request.user?.workspaceId;
            const userId = request.user?.userId;
            if (!workspaceId || !userId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const data = createMessageSchema.parse({
                ...request.body,
                conversationId: request.params.id,
                senderType: 'agent',
                senderId: userId,
            });
            const message = await inboxService.addMessage(data);
            return reply.send({
                success: true,
                data: message,
            });
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
    // Assign conversation
    fastify.post('/conversations/:id/assign', async (request, reply) => {
        try {
            const workspaceId = request.user?.workspaceId;
            const userId = request.user?.userId;
            if (!workspaceId || !userId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const { assigned_to } = request.body;
            const conversation = await inboxService.assignConversation(request.params.id, workspaceId, assigned_to, userId);
            return reply.send({
                success: true,
                data: conversation,
            });
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
    // Mark as read
    fastify.post('/conversations/:id/read', async (request, reply) => {
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
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
    // Get conversation stats
    fastify.get('/stats', async (request, reply) => {
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
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
    // Simulate a conversation (creates demo conversation with messages)
    fastify.post('/simulate', async (request, reply) => {
        try {
            const workspaceId = request.user?.workspaceId;
            const userId = request.user?.userId;
            if (!workspaceId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const visitorNames = ['Sarah Chen', 'Marcus Johnson', 'Emma Wilson', 'Alex Rodriguez', 'Priya Patel'];
            const visitorName = visitorNames[Math.floor(Math.random() * visitorNames.length)];
            const visitorEmail = visitorName.toLowerCase().replace(' ', '.') + '@example.com';
            // Create conversation
            const conversation = await inboxService.createConversation({
                visitorId: `sim_${Date.now()}`,
                workspaceId,
                visitorName,
                visitorEmail,
                channel: 'web',
            });
            // Simulate visitor messages and AI responses
            const exchanges = [
                { role: 'visitor', content: `Hi there! I'm looking for some help with your product.`, delay: 0 },
                { role: 'ai', content: `Hello ${visitorName.split(' ')[0]}! 👋 Welcome! I'd be happy to help you. What would you like to know about our products or services?`, delay: 500 },
                { role: 'visitor', content: `What are your pricing plans? And do you offer a free trial?`, delay: 1500 },
                { role: 'ai', content: `Great question! We offer several plans:\n\n• **Free** — Up to 50 conversations/month\n• **Starter** ($29/mo) — Up to 100 conversations\n• **Growth** ($59/mo) — Up to 2,000 conversations\n• **Plus** ($749/mo) — Custom volume\n\nAll plans come with a 7-day free trial of premium features. Would you like me to help you get started?`, delay: 2000 },
            ];
            for (const exchange of exchanges) {
                await inboxService.addMessage({
                    conversationId: conversation.id,
                    content: exchange.content,
                    senderType: exchange.role === 'visitor' ? 'visitor' : 'ai',
                    messageType: 'text',
                    isInternal: false,
                });
            }
            return reply.send({
                success: true,
                data: conversation,
            });
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
}
//# sourceMappingURL=inbox.routes.js.map