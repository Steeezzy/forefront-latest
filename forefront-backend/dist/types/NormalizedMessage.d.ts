/**
 * NormalizedMessage — Universal message format for all channels.
 *
 * Every incoming message (web chat, email, Instagram DM, WhatsApp, Messenger)
 * is converted into this shape before being stored or processed.
 */
export type MessageChannel = 'web_chat' | 'email' | 'instagram' | 'messenger' | 'whatsapp';
export type SenderType = 'visitor' | 'bot' | 'agent' | 'system';
export type ContentType = 'text' | 'image' | 'file' | 'product_card' | 'quick_reply' | 'html';
export interface NormalizedAttachment {
    id: string;
    filename: string;
    mime_type: string;
    size_bytes: number;
    url: string;
}
export interface NormalizedMessage {
    id: string;
    workspace_id: string;
    conversation_id: string;
    channel: MessageChannel;
    sender_type: SenderType;
    sender_id: string;
    sender_name?: string;
    sender_email?: string;
    content: string;
    content_type: ContentType;
    attachments?: NormalizedAttachment[];
    metadata: Record<string, any>;
    timestamp: Date;
}
/**
 * Ticket status lifecycle:
 *   open → pending → solved → closed
 *         ↘ (can jump) ↗
 */
export type TicketStatus = 'open' | 'pending' | 'solved' | 'closed' | 'unassigned';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketSource = 'chat' | 'email' | 'manual' | 'widget' | 'api' | 'flow';
export interface TicketFilters {
    status?: TicketStatus | 'all';
    priority?: TicketPriority;
    assigned_to?: string | 'unassigned';
    tags?: string[];
    source?: TicketSource;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: 'created_at' | 'updated_at' | 'priority';
    sort_order?: 'asc' | 'desc';
}
//# sourceMappingURL=NormalizedMessage.d.ts.map