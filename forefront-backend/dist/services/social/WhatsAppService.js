/**
 * WhatsAppService — WhatsApp Cloud API integration.
 *
 * Handles inbound webhook parsing, outbound messaging (text, media,
 * templates, interactive), and read receipts.
 *
 * API Base: https://graph.facebook.com/v19.0
 */
import { pool } from '../../config/db.js';
const API_BASE = 'https://graph.facebook.com/v19.0';
export class WhatsAppService {
    /**
     * Parse inbound webhook payload into normalized messages.
     */
    parseWebhook(payload) {
        const messages = [];
        if (!payload?.entry)
            return messages;
        for (const entry of payload.entry) {
            for (const change of entry.changes || []) {
                const value = change.value;
                if (!value?.messages)
                    continue;
                const contacts = value.contacts || [];
                const phoneNumberId = value.metadata?.phone_number_id || '';
                for (const msg of value.messages) {
                    const contact = contacts.find((c) => c.wa_id === msg.from) || {};
                    const content = this.parseContent(msg);
                    const attachments = this.parseAttachments(msg);
                    messages.push({
                        channel: 'whatsapp',
                        account_id: phoneNumberId,
                        sender_id: msg.from,
                        sender_name: contact.profile?.name,
                        recipient_id: phoneNumberId,
                        external_message_id: msg.id,
                        content,
                        attachments,
                        reply_to_message_id: msg.context?.id,
                        timestamp: new Date(parseInt(msg.timestamp) * 1000),
                        raw: msg,
                    });
                }
            }
        }
        return messages;
    }
    /**
     * Parse status updates (delivery receipts) from webhook.
     */
    parseStatusUpdate(payload) {
        const receipts = [];
        if (!payload?.entry)
            return receipts;
        for (const entry of payload.entry) {
            for (const change of entry.changes || []) {
                const statuses = change.value?.statuses || [];
                for (const status of statuses) {
                    receipts.push({
                        external_message_id: status.id,
                        channel: 'whatsapp',
                        status: status.status,
                        timestamp: new Date(parseInt(status.timestamp) * 1000),
                        error_code: status.errors?.[0]?.code?.toString(),
                        error_message: status.errors?.[0]?.title,
                    });
                }
            }
        }
        return receipts;
    }
    /**
     * Send a text message.
     */
    async sendText(accountId, to, text, replyToId) {
        const token = await this.getAccessToken(accountId);
        const body = {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
        };
        if (replyToId) {
            body.context = { message_id: replyToId };
        }
        const data = await this.apiCall(accountId, token, body);
        return data.messages?.[0]?.id || '';
    }
    /**
     * Send media (image, video, audio, document).
     */
    async sendMedia(accountId, to, type, mediaUrl, caption) {
        const token = await this.getAccessToken(accountId);
        const body = {
            messaging_product: 'whatsapp',
            to,
            type,
            [type]: { link: mediaUrl, ...(caption ? { caption } : {}) },
        };
        const data = await this.apiCall(accountId, token, body);
        return data.messages?.[0]?.id || '';
    }
    /**
     * Send a template message.
     */
    async sendTemplate(accountId, to, templateName, languageCode, components = []) {
        const token = await this.getAccessToken(accountId);
        const body = {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode },
                components,
            },
        };
        const data = await this.apiCall(accountId, token, body);
        return data.messages?.[0]?.id || '';
    }
    /**
     * Send interactive message (buttons or list).
     */
    async sendInteractive(accountId, to, interactive) {
        const token = await this.getAccessToken(accountId);
        const body = {
            messaging_product: 'whatsapp',
            to,
            type: 'interactive',
            interactive,
        };
        const data = await this.apiCall(accountId, token, body);
        return data.messages?.[0]?.id || '';
    }
    /**
     * Mark a message as read.
     */
    async markAsRead(accountId, messageId) {
        const token = await this.getAccessToken(accountId);
        await this.apiCall(accountId, token, {
            messaging_product: 'whatsapp',
            message_id: messageId,
            status: 'read',
        });
    }
    /**
     * Get account details (phone number display name).
     */
    async getAccountDetails(phoneNumberId, accessToken) {
        const response = await fetch(`${API_BASE}/${phoneNumberId}?fields=display_phone_number,verified_name`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw this.parseError(await response.json());
        }
        const data = await response.json();
        return {
            displayName: data.verified_name || '',
            phoneNumber: data.display_phone_number || '',
        };
    }
    // ─── Private Helpers ───────────────────────────────────────────────
    parseContent(msg) {
        switch (msg.type) {
            case 'text':
                return { type: 'text', text: msg.text?.body || '' };
            case 'image':
                return { type: 'image', media_url: msg.image?.id, mime_type: msg.image?.mime_type, caption: msg.image?.caption };
            case 'video':
                return { type: 'video', media_url: msg.video?.id, mime_type: msg.video?.mime_type, caption: msg.video?.caption };
            case 'audio':
                return { type: 'audio', media_url: msg.audio?.id, mime_type: msg.audio?.mime_type };
            case 'document':
                return { type: 'document', media_url: msg.document?.id, mime_type: msg.document?.mime_type, file_name: msg.document?.filename };
            case 'sticker':
                return { type: 'sticker', media_url: msg.sticker?.id, mime_type: msg.sticker?.mime_type };
            case 'location':
                return { type: 'location', latitude: msg.location?.latitude, longitude: msg.location?.longitude, text: msg.location?.name };
            case 'reaction':
                return { type: 'reaction', emoji: msg.reaction?.emoji, text: msg.reaction?.emoji };
            case 'interactive':
                return this.parseInteractiveReply(msg.interactive);
            default:
                return { type: 'unsupported', text: `[Unsupported message type: ${msg.type}]` };
        }
    }
    parseInteractiveReply(interactive) {
        if (interactive?.type === 'button_reply') {
            return { type: 'interactive', text: interactive.button_reply.title, payload: interactive.button_reply.id };
        }
        if (interactive?.type === 'list_reply') {
            return { type: 'interactive', text: interactive.list_reply.title, payload: interactive.list_reply.id };
        }
        return { type: 'text', text: '[Interactive reply]' };
    }
    parseAttachments(msg) {
        const attachments = [];
        const types = ['image', 'video', 'audio', 'document'];
        for (const type of types) {
            if (msg[type]) {
                attachments.push({
                    id: msg[type].id,
                    type,
                    url: msg[type].id, // WA uses media IDs — you need to GET /media/{id} to get URL
                    mime_type: msg[type].mime_type,
                    file_name: msg[type].filename,
                });
            }
        }
        return attachments;
    }
    async getAccessToken(accountId) {
        const result = await pool.query(`SELECT access_token FROM social_accounts WHERE account_id = $1 AND channel = 'whatsapp' AND connected = true`, [accountId]);
        if (result.rows.length === 0)
            throw new Error(`WhatsApp account ${accountId} not found or disconnected`);
        return result.rows[0].access_token;
    }
    async apiCall(phoneNumberId, token, body) {
        const response = await fetch(`${API_BASE}/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) {
            throw this.parseError(data);
        }
        return data;
    }
    parseError(data) {
        const error = data?.error || {};
        return new Error(`WhatsApp API Error [${error.code || 'UNKNOWN'}]: ${error.message || JSON.stringify(data)}`);
    }
}
export const whatsAppService = new WhatsAppService();
//# sourceMappingURL=WhatsAppService.js.map