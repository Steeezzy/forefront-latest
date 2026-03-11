/**
 * MessageNormalizerService — Transforms channel-specific payloads into NormalizedMessage.
 *
 * Each channel adapter (email, Instagram, WhatsApp, web chat) produces a raw
 * payload in its own format. This service converts that payload into the
 * universal NormalizedMessage interface so downstream services (inbox, tickets,
 * AI, flows) can work with a single schema.
 *
 * @example
 *   const msg = MessageNormalizerService.normalizeFromWebChat(socketPayload);
 *   await inboxService.addMessage(msg);
 */
import type { NormalizedMessage, SenderType, NormalizedAttachment } from '../types/NormalizedMessage.js';
export declare class MessageNormalizerService {
    static normalizeFromWebChat(payload: {
        workspace_id: string;
        conversation_id: string;
        sender_type: SenderType;
        sender_id: string;
        sender_name?: string;
        content: string;
        metadata?: Record<string, any>;
    }): NormalizedMessage;
    static normalizeFromEmail(payload: {
        workspace_id: string;
        conversation_id: string;
        from_address: string;
        from_name?: string;
        subject: string;
        body_text: string;
        body_html?: string;
        message_id_header?: string;
        in_reply_to?: string;
        attachments?: NormalizedAttachment[];
    }): NormalizedMessage;
    static normalizeFromInstagram(payload: {
        workspace_id: string;
        conversation_id: string;
        ig_sender_id: string;
        ig_sender_name?: string;
        text?: string;
        media_url?: string;
        media_type?: string;
        ig_message_id: string;
        ig_timestamp: number;
    }): NormalizedMessage;
    static normalizeFromMessenger(payload: {
        workspace_id: string;
        conversation_id: string;
        fb_sender_id: string;
        fb_sender_name?: string;
        text?: string;
        attachments?: Array<{
            type: string;
            payload: {
                url: string;
            };
        }>;
        fb_message_id: string;
        fb_timestamp: number;
    }): NormalizedMessage;
    static normalizeFromWhatsApp(payload: {
        workspace_id: string;
        conversation_id: string;
        wa_sender_phone: string;
        wa_sender_name?: string;
        text?: string;
        media_url?: string;
        media_mime_type?: string;
        wa_message_id: string;
        wa_timestamp: number;
    }): NormalizedMessage;
}
//# sourceMappingURL=MessageNormalizerService.d.ts.map