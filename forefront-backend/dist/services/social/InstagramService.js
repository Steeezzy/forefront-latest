/**
 * InstagramService — Instagram Direct Messages via Meta Graph API.
 *
 * Handles inbound DMs (text, attachments, reactions, postbacks),
 * outbound messaging (text, media, generic templates, quick replies),
 * and sender profile fetching.
 */
import { pool } from '../../config/db.js';
const API_BASE = 'https://graph.facebook.com/v19.0';
export class InstagramService {
    /**
     * Parse inbound webhook payload.
     */
    parseWebhook(payload) {
        const messages = [];
        if (!payload?.entry)
            return messages;
        for (const entry of payload.entry) {
            const accountId = entry.id;
            for (const event of entry.messaging || []) {
                // Skip echo messages (our own outbound)
                if (event.message?.is_echo)
                    continue;
                const senderId = event.sender?.id;
                const recipientId = event.recipient?.id;
                if (event.message) {
                    const content = this.parseMessageContent(event.message);
                    const attachments = this.parseAttachments(event.message.attachments || []);
                    messages.push({
                        channel: 'instagram',
                        account_id: accountId,
                        sender_id: senderId,
                        recipient_id: recipientId,
                        external_message_id: event.message.mid,
                        content,
                        attachments,
                        reply_to_message_id: event.message.reply_to?.mid,
                        timestamp: new Date(event.timestamp),
                        raw: event,
                    });
                }
                // Postback (button tap)
                if (event.postback) {
                    messages.push({
                        channel: 'instagram',
                        account_id: accountId,
                        sender_id: senderId,
                        recipient_id: recipientId,
                        external_message_id: `pb_${event.timestamp}`,
                        content: { type: 'text', text: event.postback.title, payload: event.postback.payload },
                        attachments: [],
                        timestamp: new Date(event.timestamp),
                        raw: event,
                    });
                }
                // Reaction
                if (event.reaction) {
                    messages.push({
                        channel: 'instagram',
                        account_id: accountId,
                        sender_id: senderId,
                        recipient_id: recipientId,
                        external_message_id: `rx_${event.timestamp}`,
                        content: { type: 'reaction', emoji: event.reaction.emoji, text: event.reaction.emoji },
                        attachments: [],
                        timestamp: new Date(event.timestamp),
                        raw: event,
                    });
                }
            }
        }
        return messages;
    }
    /**
     * Send a text message.
     */
    async sendText(accountId, recipientId, text) {
        const token = await this.getAccessToken(accountId);
        return this.sendAPI(accountId, token, {
            recipient: { id: recipientId },
            message: { text },
        });
    }
    /**
     * Send media attachment.
     */
    async sendMedia(accountId, recipientId, type, url) {
        const token = await this.getAccessToken(accountId);
        return this.sendAPI(accountId, token, {
            recipient: { id: recipientId },
            message: {
                attachment: { type, payload: { url, is_reusable: true } },
            },
        });
    }
    /**
     * Send generic template (cards with image + buttons).
     */
    async sendGenericTemplate(accountId, recipientId, elements) {
        const token = await this.getAccessToken(accountId);
        return this.sendAPI(accountId, token, {
            recipient: { id: recipientId },
            message: {
                attachment: {
                    type: 'template',
                    payload: { template_type: 'generic', elements },
                },
            },
        });
    }
    /**
     * Send quick replies.
     */
    async sendQuickReplies(accountId, recipientId, text, quickReplies) {
        const token = await this.getAccessToken(accountId);
        return this.sendAPI(accountId, token, {
            recipient: { id: recipientId },
            message: {
                text,
                quick_replies: quickReplies.map((qr) => ({
                    content_type: 'text',
                    title: qr.title,
                    payload: qr.payload,
                })),
            },
        });
    }
    /**
     * Get sender profile (may fail due to privacy).
     */
    async getSenderProfile(senderId, accessToken) {
        try {
            const response = await fetch(`${API_BASE}/${senderId}?fields=name,profile_pic&access_token=${accessToken}`);
            if (!response.ok)
                return { name: 'Instagram User' };
            const data = await response.json();
            return { name: data.name || 'Instagram User', profilePic: data.profile_pic };
        }
        catch {
            return { name: 'Instagram User' };
        }
    }
    // ─── Private Helpers ───────────────────────────────────────────────
    parseMessageContent(msg) {
        if (msg.text)
            return { type: 'text', text: msg.text };
        if (msg.attachments && msg.attachments.length > 0) {
            const att = msg.attachments[0];
            switch (att.type) {
                case 'image': return { type: 'image', media_url: att.payload?.url };
                case 'video': return { type: 'video', media_url: att.payload?.url };
                case 'audio': return { type: 'audio', media_url: att.payload?.url };
                case 'file': return { type: 'document', media_url: att.payload?.url };
                case 'sticker': return { type: 'sticker', media_url: att.payload?.url };
                default: return { type: 'unsupported', text: `[Unsupported: ${att.type}]` };
            }
        }
        if (msg.sticker_id)
            return { type: 'sticker', text: `sticker:${msg.sticker_id}` };
        return { type: 'text', text: '' };
    }
    parseAttachments(attachments) {
        return attachments.map((att) => ({
            type: att.type,
            url: att.payload?.url || '',
            mime_type: att.payload?.mime_type,
            size: att.payload?.size,
            file_name: att.payload?.name,
        }));
    }
    async getAccessToken(accountId) {
        const result = await pool.query(`SELECT access_token FROM social_accounts WHERE account_id = $1 AND channel = 'instagram' AND connected = true`, [accountId]);
        if (result.rows.length === 0)
            throw new Error(`Instagram account ${accountId} not found`);
        return result.rows[0].access_token;
    }
    async sendAPI(accountId, token, body) {
        const response = await fetch(`${API_BASE}/${accountId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Instagram API Error [${data.error?.code || 'UNKNOWN'}]: ${data.error?.message || JSON.stringify(data)}`);
        }
        return data.message_id || data.recipient_id || '';
    }
}
export const instagramService = new InstagramService();
//# sourceMappingURL=InstagramService.js.map