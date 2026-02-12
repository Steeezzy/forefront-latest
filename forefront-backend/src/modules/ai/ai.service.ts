import { ChatService } from '../chat/chat.service.js';
import { env } from '../../config/env.js';
import { UsageService } from '../usage/usage.service.js';

export class AIService {
    private chatService: ChatService;
    private usageService: UsageService;

    constructor() {
        this.chatService = new ChatService();
        this.usageService = new UsageService();
    }

    async generateResponse(conversationId: string, workspaceId: string) {
        console.log(`AIService: Generating response for conversation ${conversationId} using Sarvam AI`);

        // 1. Fetch Context (Last 10 messages)
        const messages = await this.chatService.getMessages(conversationId);

        // 2. Fetch Agent/System Prompt
        const systemPrompt = "You are a helpful AI support agent for a SaaS platform. Answer concisely.";

        // 3. Construct Payload
        // 3. Construct Payload
        // Sarvam AI (and some others) requires strict User/Assistant alternation and no System role.
        let formattedMessages: { role: string; content: string }[] = [];

        // Prepend System Prompt to the context if possible, or just merge it into the latest user message
        // But logical flow is: System Instructions -> User Query
        // We will try to prepend it to the VERY FIRST user message in the window.

        let messagesMapped = messages.map(m => ({
            role: m.sender_type === 'visitor' ? 'user' : 'assistant',
            content: m.content
        }));

        // Enforce Alternation: Merge consecutive messages
        if (messagesMapped.length > 0) {
            const merged: typeof messagesMapped = [];
            let last = messagesMapped[0];

            for (let i = 1; i < messagesMapped.length; i++) {
                const current = messagesMapped[i];
                if (current.role === last.role) {
                    last.content += '\n' + current.content;
                } else {
                    merged.push(last);
                    last = current;
                }
            }
            merged.push(last);
            messagesMapped = merged;
        }

        // Ensure starts with User (if first is assistant, drop it or prepend dummy user? Dropping is safer for context)
        if (messagesMapped.length > 0 && messagesMapped[0].role !== 'user') {
            messagesMapped.shift();
        }

        // If nothing left (unlikely if triggered by visitor), return error or dummy
        if (messagesMapped.length === 0) {
            console.error('No user messages found for AI context');
            return null; // Or throw
        }

        // Prepend System Prompt to the FIRST User message
        messagesMapped[0].content = `${systemPrompt}\n\n${messagesMapped[0].content}`;

        const openAIMessages = messagesMapped;

        try {
            // 4. Call Sarvam AI
            if (env.SARVAM_API_KEY) {
                const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${env.SARVAM_API_KEY}`
                    },
                    body: JSON.stringify({
                        messages: openAIMessages,
                        model: 'sarvam-m',
                        max_tokens: 500,
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Sarvam API Error Body:', errorText);
                    throw new Error(`Sarvam API Error: ${response.status} ${errorText}`);
                }

                const data = await response.json() as any;
                const aiContent = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
                const totalTokens = data.usage?.total_tokens || 0;

                // 5. Save AI Message to DB
                const aiMessage = await this.chatService.addMessage({
                    conversationId,
                    content: aiContent,
                    senderType: 'ai'
                });

                // 6. Track Usage
                if (totalTokens > 0) {
                    // We need workspaceId here. It was passed to generateResponse.
                    await this.usageService.trackTokens(workspaceId, totalTokens);
                }

                return aiMessage;
            } else {
                console.log('AIService: No SARVAM_API_KEY, mocking response.');
                // Mock response via setTimeout
                await new Promise(r => setTimeout(r, 1000));
                const aiMessage = await this.chatService.addMessage({
                    conversationId,
                    content: "This is a mocked response (SARVAM_API_KEY missing).",
                    senderType: 'ai'
                });
                return aiMessage;
            }

        } catch (e) {
            console.error('AIService: Error calling Sarvam AI', e);
            const errorMessage = await this.chatService.addMessage({
                conversationId,
                content: "I'm having trouble connecting to my brain right now.",
                senderType: 'ai'
            });
            return errorMessage;
        }
    }
}
