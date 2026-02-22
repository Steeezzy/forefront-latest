import { ChatController } from './chat.controller.js';
const chatController = new ChatController();
export async function chatRoutes(app) {
    app.post('/conversations', chatController.createConversation);
    app.get('/conversations', chatController.getConversations);
    app.post('/messages', chatController.addMessage);
    app.get('/conversations/:conversationId/messages', chatController.getMessages);
}
