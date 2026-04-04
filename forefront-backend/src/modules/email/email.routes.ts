import type { FastifyInstance } from 'fastify';
import { emailController } from './email.controller.js';

export async function emailRoutes(app: FastifyInstance) {
  app.post('/:workspaceId/connect', emailController.connect.bind(emailController));
  app.get('/:workspaceId/config', emailController.getConfig.bind(emailController));
  app.put('/:workspaceId/config', emailController.updateConfig.bind(emailController));
  app.delete('/:workspaceId/config', emailController.deleteConfig.bind(emailController));
  app.post('/:workspaceId/test', emailController.testEmail.bind(emailController));
  app.get('/:workspaceId/conversations', emailController.getConversations.bind(emailController));
  app.get('/:workspaceId/conversations/:conversationId/messages', emailController.getMessages.bind(emailController));
}