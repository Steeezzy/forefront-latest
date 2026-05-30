import type { FastifyInstance } from 'fastify';
import { whatsappController } from './whatsapp.controller.js';

export async function whatsappRoutes(app: FastifyInstance) {
  app.post('/:workspaceId/connect', whatsappController.connect.bind(whatsappController));
  app.get('/:workspaceId/config', whatsappController.getConfig.bind(whatsappController));
  app.put('/:workspaceId/config', whatsappController.updateConfig.bind(whatsappController));
  app.delete('/:workspaceId/config', whatsappController.deleteConfig.bind(whatsappController));
  app.post('/:workspaceId/test', whatsappController.testMessage.bind(whatsappController));
  app.get('/:workspaceId/conversations', whatsappController.getConversations.bind(whatsappController));
  app.get('/:workspaceId/conversations/:conversationId/messages', whatsappController.getMessages.bind(whatsappController));
  app.post('/:workspaceId/send', whatsappController.sendManual.bind(whatsappController));
}
