import type { FastifyInstance } from 'fastify';
import { facebookController } from './facebook.controller.js';

export async function facebookRoutes(app: FastifyInstance) {
  app.post('/:workspaceId/connect', facebookController.connect.bind(facebookController));
  app.get('/:workspaceId/config', facebookController.getConfig.bind(facebookController));
  app.put('/:workspaceId/config', facebookController.updateConfig.bind(facebookController));
  app.delete('/:workspaceId/config', facebookController.deleteConfig.bind(facebookController));
  app.post('/:workspaceId/test', facebookController.testMessage.bind(facebookController));
  app.get('/:workspaceId/conversations', facebookController.getConversations.bind(facebookController));
  app.get('/:workspaceId/conversations/:conversationId/messages', facebookController.getMessages.bind(facebookController));
}
