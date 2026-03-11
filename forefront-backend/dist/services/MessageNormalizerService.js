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
import * as crypto from 'crypto';
export class MessageNormalizerService {
    // ─── Web Chat (Socket.IO) ───────────────────────────────────────────
    static normalizeFromWebChat(payload) {
        return {
            id: crypto.randomUUID(),
            workspace_id: payload.workspace_id,
            conversation_id: payload.conversation_id,
            channel: 'web_chat',
            sender_type: payload.sender_type,
            sender_id: payload.sender_id,
            sender_name: payload.sender_name,
            content: payload.content,
            content_type: 'text',
            metadata: payload.metadata ?? {},
            timestamp: new Date(),
        };
    }
    // ─── Email ──────────────────────────────────────────────────────────
    static normalizeFromEmail(payload) {
        return {
            id: crypto.randomUUID(),
            workspace_id: payload.workspace_id,
            conversation_id: payload.conversation_id,
            channel: 'email',
            sender_type: 'visitor',
            sender_id: payload.from_address,
            sender_name: payload.from_name,
            sender_email: payload.from_address,
            content: payload.body_text,
            content_type: payload.body_html ? 'html' : 'text',
            attachments: payload.attachments,
            metadata: {
                subject: payload.subject,
                message_id_header: payload.message_id_header,
                in_reply_to: payload.in_reply_to,
                body_html: payload.body_html,
            },
            timestamp: new Date(),
        };
    }
    // ─── Instagram DM ───────────────────────────────────────────────────
    static normalizeFromInstagram(payload) {
        const hasMedia = !!payload.media_url;
        const contentType = hasMedia ? 'image' : 'text';
        return {
            id: crypto.randomUUID(),
            workspace_id: payload.workspace_id,
            conversation_id: payload.conversation_id,
            channel: 'instagram',
            sender_type: 'visitor',
            sender_id: payload.ig_sender_id,
            sender_name: payload.ig_sender_name,
            content: payload.text ?? '',
            content_type: contentType,
            attachments: hasMedia
                ? [
                    {
                        id: crypto.randomUUID(),
                        filename: `ig_media_${payload.ig_message_id}`,
                        mime_type: payload.media_type === 'video' ? 'video/mp4' : 'image/jpeg',
                        size_bytes: 0,
                        url: payload.media_url,
                    },
                ]
                : undefined,
            metadata: {
                ig_message_id: payload.ig_message_id,
                ig_timestamp: payload.ig_timestamp,
                media_type: payload.media_type,
            },
            timestamp: new Date(payload.ig_timestamp * 1000),
        };
    }
    // ─── Facebook Messenger ─────────────────────────────────────────────
    static normalizeFromMessenger(payload) {
        const normalizedAttachments = (payload.attachments ?? []).map((att) => ({
            id: crypto.randomUUID(),
            filename: `fb_attachment_${crypto.randomUUID().slice(0, 8)}`,
            mime_type: att.type === 'image' ? 'image/jpeg' : 'application/octet-stream',
            size_bytes: 0,
            url: att.payload.url,
        }));
        return {
            id: crypto.randomUUID(),
            workspace_id: payload.workspace_id,
            conversation_id: payload.conversation_id,
            channel: 'messenger',
            sender_type: 'visitor',
            sender_id: payload.fb_sender_id,
            sender_name: payload.fb_sender_name,
            content: payload.text ?? '',
            content_type: normalizedAttachments.length > 0 ? 'image' : 'text',
            attachments: normalizedAttachments.length > 0 ? normalizedAttachments : undefined,
            metadata: {
                fb_message_id: payload.fb_message_id,
                fb_timestamp: payload.fb_timestamp,
            },
            timestamp: new Date(payload.fb_timestamp),
        };
    }
    // ─── WhatsApp Business ──────────────────────────────────────────────
    static normalizeFromWhatsApp(payload) {
        const hasMedia = !!payload.media_url;
        return {
            id: crypto.randomUUID(),
            workspace_id: payload.workspace_id,
            conversation_id: payload.conversation_id,
            channel: 'whatsapp',
            sender_type: 'visitor',
            sender_id: payload.wa_sender_phone,
            sender_name: payload.wa_sender_name,
            content: payload.text ?? '',
            content_type: hasMedia ? 'image' : 'text',
            attachments: hasMedia
                ? [
                    {
                        id: crypto.randomUUID(),
                        filename: `wa_media_${payload.wa_message_id}`,
                        mime_type: payload.media_mime_type ?? 'application/octet-stream',
                        size_bytes: 0,
                        url: payload.media_url,
                    },
                ]
                : undefined,
            metadata: {
                wa_message_id: payload.wa_message_id,
                wa_timestamp: payload.wa_timestamp,
                wa_sender_phone: payload.wa_sender_phone,
            },
            timestamp: new Date(payload.wa_timestamp * 1000),
        };
    }
}
//# sourceMappingURL=MessageNormalizerService.js.map