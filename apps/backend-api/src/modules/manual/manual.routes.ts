import { FastifyInstance } from 'fastify';
import { manualController } from './manual.controller.js';

export default async function manualRoutes(app: FastifyInstance) {
    app.post('/create', manualController.createEntry.bind(manualController));
    app.get('/:workspaceId/entries', manualController.getEntries.bind(manualController));
    app.delete('/:entryId', manualController.deleteEntry.bind(manualController));
    app.get('/:workspaceId/summary', manualController.getSummary.bind(manualController));
}
