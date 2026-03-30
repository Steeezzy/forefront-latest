import { FastifyRequest, FastifyReply } from 'fastify';
import { dashboardService } from './dashboard.service.js';

export class DashboardController {
  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { period } = request.query as { period?: string };
      const dashboard = await dashboardService.getDashboard(workspaceId, period);
      return reply.send(dashboard);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }
}

export const dashboardController = new DashboardController();
