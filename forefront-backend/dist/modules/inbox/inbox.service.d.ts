import { z } from 'zod';
export declare const createConversationSchema: z.ZodObject<{
    visitorId: z.ZodString;
    workspaceId: z.ZodString;
    visitorName: z.ZodOptional<z.ZodString>;
    visitorEmail: z.ZodOptional<z.ZodString>;
    visitorPhone: z.ZodOptional<z.ZodString>;
    channel: z.ZodDefault<z.ZodEnum<{
        email: "email";
        instagram: "instagram";
        whatsapp: "whatsapp";
        messenger: "messenger";
        web: "web";
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const createMessageSchema: z.ZodObject<{
    conversationId: z.ZodString;
    content: z.ZodString;
    senderType: z.ZodEnum<{
        system: "system";
        visitor: "visitor";
        agent: "agent";
        ai: "ai";
    }>;
    senderId: z.ZodOptional<z.ZodString>;
    messageType: z.ZodDefault<z.ZodEnum<{
        system: "system";
        text: "text";
        file: "file";
        image: "image";
        note: "note";
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    isInternal: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const updateConversationSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        open: "open";
        closed: "closed";
        pending: "pending";
        snoozed: "snoozed";
    }>>;
    assignedUserId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    priority: z.ZodOptional<z.ZodEnum<{
        urgent: "urgent";
        high: "high";
        normal: "normal";
        low: "low";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    visitorName: z.ZodOptional<z.ZodString>;
    visitorEmail: z.ZodOptional<z.ZodString>;
    snoozedUntil: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export interface ConversationFilters {
    status?: 'open' | 'closed' | 'snoozed' | 'pending' | 'all';
    assignedTo?: 'me' | 'unassigned' | string;
    channel?: string;
    search?: string;
    tags?: string[];
    priority?: string;
    page?: number;
    limit?: number;
}
export declare class InboxService {
    createConversation(data: z.infer<typeof createConversationSchema>): Promise<any>;
    getConversations(workspaceId: string, filters?: ConversationFilters): Promise<{
        conversations: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getConversationById(conversationId: string, workspaceId: string): Promise<any>;
    updateConversation(conversationId: string, workspaceId: string, data: z.infer<typeof updateConversationSchema>): Promise<any>;
    addMessage(data: z.infer<typeof createMessageSchema>): Promise<any>;
    getMessages(conversationId: string, workspaceId: string): Promise<any[]>;
    markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
    assignConversation(conversationId: string, workspaceId: string, assignedTo: string | null, assignedBy: string): Promise<any>;
    getConversationStats(workspaceId: string): Promise<any>;
}
export declare const inboxService: InboxService;
//# sourceMappingURL=inbox.service.d.ts.map