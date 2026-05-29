import type { FastifyInstance } from 'fastify';
import { managedAgentsService } from './managed-agents.service.js';
import { authenticate } from '../auth/auth.middleware.js';

export async function managedAgentRoutes(app: FastifyInstance) {
    app.get('/status', { preHandler: [authenticate] }, async (request, reply) => {
        try {
            const { workspaceId } = request.query as { workspaceId: string };
            const status = await managedAgentsService.getStatus(workspaceId);
            return reply.send(status);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });

    app.post('/toggle', { preHandler: [authenticate] }, async (request, reply) => {
        try {
            const { workspaceId, enabled } = request.body as { workspaceId: string, enabled: boolean };
            const status = await managedAgentsService.toggle(workspaceId, enabled);
            return reply.send(status);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });

    app.get('/runs', { preHandler: [authenticate] }, async (request, reply) => {
        try {
            const { workspaceId, page, limit } = request.query as { workspaceId: string, page?: string, limit?: string };
            const result = await managedAgentsService.listRuns(
                workspaceId, 
                page ? parseInt(page) : 1, 
                limit ? parseInt(limit) : 20
            );
            return reply.send(result);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });

    app.get('/runs/:sessionId', { preHandler: [authenticate] }, async (request, reply) => {
        try {
            const { sessionId } = request.params as { sessionId: string };
            const detail = await managedAgentsService.getRunDetail(sessionId);
            return reply.send(detail);
        } catch (error: any) {
            return reply.status(404).send({ error: error.message });
        }
    });
}
