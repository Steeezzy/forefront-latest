import { enhancedRAGService } from '../chat/enhanced-rag.service.js';
import { authenticate } from '../auth/auth.middleware.js';
export async function copilotRoutes(fastify) {
    // All copilot routes require authentication
    fastify.addHook('onRequest', authenticate);
    // Get reply suggestions
    fastify.get('/suggest', async (request, reply) => {
        try {
            const workspaceId = request.user?.workspaceId;
            const query = request.query;
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
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
    // Rewrite draft
    fastify.post('/rewrite', async (request, reply) => {
        try {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const { draft, tone } = request.body;
            if (!draft) {
                return reply.code(400).send({ error: 'Draft is required' });
            }
            const rewritten = await enhancedRAGService.rewriteDraft(draft, tone);
            return reply.send({
                success: true,
                data: { rewritten },
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
