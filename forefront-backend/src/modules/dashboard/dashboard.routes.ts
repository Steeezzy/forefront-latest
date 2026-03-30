import { FastifyInstance } from 'fastify';
import { dashboardController } from './dashboard.controller.js';

export default async function dashboardRoutes(app: FastifyInstance) {
    app.get('/:workspaceId', dashboardController.getDashboard.bind(dashboardController));
}
