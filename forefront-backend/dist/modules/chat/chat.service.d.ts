import { z } from 'zod';
export declare const createConversationSchema: z.ZodObject<{
    visitorId: z.ZodString;
    workspaceId: z.ZodString;
}, z.core.$strip>;
export declare const createMessageSchema: z.ZodObject<{
    conversationId: z.ZodString;
    content: z.ZodString;
    senderType: z.ZodEnum<{
        visitor: "visitor";
        agent: "agent";
        ai: "ai";
    }>;
}, z.core.$strip>;
export declare class ChatService {
    createConversation(data: z.infer<typeof createConversationSchema>): Promise<any>;
    getConversations(workspaceId: string): Promise<any[]>;
    getConversationById(conversationId: string): Promise<any>;
    addMessage(data: z.infer<typeof createMessageSchema>): Promise<any>;
    getMessages(conversationId: string): Promise<any[]>;
}
//# sourceMappingURL=chat.service.d.ts.map