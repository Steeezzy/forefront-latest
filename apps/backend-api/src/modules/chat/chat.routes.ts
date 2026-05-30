import type { FastifyInstance } from 'fastify';
import { ChatController } from './chat.controller.js';

const chatController = new ChatController();

export async function chatRoutes(app: FastifyInstance) {
    app.post('/conversations', chatController.createConversation);
    app.get('/conversations', chatController.getConversations);
    app.post('/messages', chatController.addMessage);
    app.get('/conversations/:conversationId/messages', chatController.getMessages);
}
