import type { FastifyInstance } from 'fastify';
import { customerController } from './customer.controller.js';

export async function customerRoutes(app: FastifyInstance) {
  // List customers with filters
  app.get('/:workspaceId', customerController.listCustomers.bind(customerController));

  // Get risky customers
  app.get('/:workspaceId/risky', customerController.getRiskyCustomers.bind(customerController));

  // Get upcoming actions
  app.get('/:workspaceId/upcoming-actions', customerController.getUpcomingActions.bind(customerController));

  // Get single customer profile
  app.get('/:workspaceId/:profileId', customerController.getProfile.bind(customerController));

  // Get customer interaction history
  app.get('/:workspaceId/:profileId/history', customerController.getHistory.bind(customerController));

  // Sync customer interaction (create/update profile and log interaction)
  app.post('/:workspaceId/sync', customerController.syncInteraction.bind(customerController));

  // Update customer notes
  app.put('/:workspaceId/:profileId/notes', customerController.updateNotes.bind(customerController));

  // Create customer action
  app.post('/:workspaceId/:profileId/action', customerController.createAction.bind(customerController));
}

export default customerRoutes;
