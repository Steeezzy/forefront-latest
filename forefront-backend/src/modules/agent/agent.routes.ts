import type { FastifyInstance } from 'fastify';
import { AgentController } from './agent.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const agentController = new AgentController();

export async function agentRoutes(app: FastifyInstance) {
    app.get('/primary', { preHandler: [authenticate] }, agentController.getPrimary);
    app.patch('/:agentId/config', { preHandler: [authenticate] }, agentController.updateConfig);
    app.get('/:agentId', { preHandler: [authenticate] }, agentController.getAgent);
}
