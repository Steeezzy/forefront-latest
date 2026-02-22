import { ChatService } from '../chat/chat.service.js';
import { UsageService } from '../usage/usage.service.js';
import { RagService } from '../chat/rag.service.js';
export class AIService {
    constructor() {
        this.chatService = new ChatService();
        this.usageService = new UsageService();
        this.ragService = new RagService();
    }
    async generateResponse(conversationId, workspaceId) {
        console.log(`AIService: Generating RAG response for conversation ${conversationId}`);
        // 1. Fetch Last User Message
        const messages = await this.chatService.getMessages(conversationId);
        const lastUserMessage = messages.reverse().find(m => m.sender_type === 'visitor');
        if (!lastUserMessage) {
            console.log('AIService: No user message found to respond to.');
            return null;
        }
        // 2. Call RAG Service
        const aiContent = await this.ragService.resolveAIResponse(workspaceId, lastUserMessage.content);
        // 3. Save AI Message to DB
        const aiMessage = await this.chatService.addMessage({
            conversationId,
            content: aiContent,
            senderType: 'ai'
        });
        // 4. Track Usage (Approximation: 1 message = 1 unit, or count words)
        // Ideally we get token count from RAG service, but for now fixed or length based
        await this.usageService.trackTokens(workspaceId, aiContent.length / 4);
        return aiMessage;
    }
}
