import type { FastifyInstance } from 'fastify';
import { instagramController } from './instagram.controller.js';

export async function instagramRoutes(app: FastifyInstance) {
  app.post('/:workspaceId/connect', instagramController.connect.bind(instagramController));
  app.get('/:workspaceId/config', instagramController.getConfig.bind(instagramController));
  app.put('/:workspaceId/config', instagramController.updateConfig.bind(instagramController));
  app.delete('/:workspaceId/config', instagramController.deleteConfig.bind(instagramController));
  app.post('/:workspaceId/test', instagramController.testDM.bind(instagramController));
  app.get('/:workspaceId/conversations', instagramController.getConversations.bind(instagramController));
  app.get('/:workspaceId/conversations/:conversationId/messages', instagramController.getMessages.bind(instagramController));
}
