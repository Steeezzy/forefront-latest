/**
 * MessengerService — Facebook Messenger Page Messaging API.
 *
 * Handles inbound webhooks (text, attachments, quick replies, referrals),
 * outbound messaging (text, attachments, templates, quick replies),
 * sender actions, and page management.
 */

import { pool } from '../../config/db.js';
import type {
    InboundSocialMessage,
    SocialDeliveryReceipt,
    SocialMessageContent,
    SocialAttachment,
    MessengerGenericElement,
    MessengerQuickReply,
} from '../../types/social.types.js';

const API_BASE = 'https://graph.facebook.com/v19.0';

export class MessengerService {

    /**
     * Parse inbound webhook payload.
     */
    parseWebhook(payload: any): InboundSocialMessage[] {
        const messages: InboundSocialMessage[] = [];
        if (!payload?.entry) return messages;

        for (const entry of payload.entry) {
            const pageId = entry.id;

            for (const event of entry.messaging || []) {
                // Skip echo messages
                if (event.message?.is_echo) continue;

                const senderId = event.sender?.id;
                const recipientId = event.recipient?.id;

                // Regular message
                if (event.message) {
                    const content = this.parseMessageContent(event.message);
                    const attachments = this.parseAttachments(event.message.attachments || []);

                    messages.push({
                        channel: 'messenger',
                        account_id: pageId,
                        sender_id: senderId,
                        recipient_id: recipientId,
                        external_message_id: event.message.mid,
                        content,
                        attachments,
                        timestamp: new Date(event.timestamp),
                        raw: event,
                    });
                }

                // Postback (button tap)
                if (event.postback) {
                    messages.push({
                        channel: 'messenger',
                        account_id: pageId,
                        sender_id: senderId,
                        recipient_id: recipientId,
                        external_message_id: `pb_${event.timestamp}`,
                        content: {
                            type: 'text',
                            text: event.postback.title || event.postback.payload,
                            payload: event.postback.payload,
                        },
                        attachments: [],
                        timestamp: new Date(event.timestamp),
                        raw: event,
                    });
                }

                // Referral (entry point metadata)
                if (event.referral && !event.postback) {
                    messages.push({
                        channel: 'messenger',
                        account_id: pageId,
                        sender_id: senderId,
                        recipient_id: recipientId,
                        external_message_id: `ref_${event.timestamp}`,
                        content: {
                            type: 'text',
                            text: `[Referral: ${event.referral.source} - ${event.referral.type}]`,
                            payload: event.referral.ref,
                        },
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
     * Parse delivery and read receipts.
     */
    parseDeliveryAndRead(payload: any): SocialDeliveryReceipt[] {
        const receipts: SocialDeliveryReceipt[] = [];
        if (!payload?.entry) return receipts;

        for (const entry of payload.entry) {
            for (const event of entry.messaging || []) {
                if (event.delivery) {
                    for (const mid of event.delivery.mids || []) {
                        receipts.push({
                            external_message_id: mid,
                            channel: 'messenger',
                            status: 'delivered',
                            timestamp: new Date(event.delivery.watermark),
                        });
                    }
                }
                if (event.read) {
                    receipts.push({
                        external_message_id: `read_${event.read.watermark}`,
                        channel: 'messenger',
                        status: 'read',
                        timestamp: new Date(event.read.watermark),
                    });
                }
            }
        }

        return receipts;
    }

    /**
     * Send a text message.
     */
    async sendText(
        pageId: string,
        recipientId: string,
        text: string,
        messagingType: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG' = 'RESPONSE'
    ): Promise<string> {
        const token = await this.getAccessToken(pageId);
        return this.sendAPI(pageId, token, {
            messaging_type: messagingType,
            recipient: { id: recipientId },
            message: { text },
        });
    }

    /**
     * Send an attachment (image, video, audio, file).
     */
    async sendAttachment(
        pageId: string,
        recipientId: string,
        type: 'image' | 'video' | 'audio' | 'file',
        url: string
    ): Promise<string> {
        const token = await this.getAccessToken(pageId);
        return this.sendAPI(pageId, token, {
            messaging_type: 'RESPONSE',
            recipient: { id: recipientId },
            message: {
                attachment: { type, payload: { url, is_reusable: true } },
            },
        });
    }

    /**
     * Send a generic template (cards with images + buttons).
     */
    async sendTemplate(
        pageId: string,
        recipientId: string,
        elements: MessengerGenericElement[]
    ): Promise<string> {
        const token = await this.getAccessToken(pageId);
        return this.sendAPI(pageId, token, {
            messaging_type: 'RESPONSE',
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
    async sendQuickReplies(
        pageId: string,
        recipientId: string,
        text: string,
        quickReplies: MessengerQuickReply[]
    ): Promise<string> {
        const token = await this.getAccessToken(pageId);
        return this.sendAPI(pageId, token, {
            messaging_type: 'RESPONSE',
            recipient: { id: recipientId },
            message: { text, quick_replies: quickReplies },
        });
    }

    /**
     * Send a sender action (typing indicator, mark seen).
     */
    async senderAction(
        pageId: string,
        recipientId: string,
        action: 'typing_on' | 'typing_off' | 'mark_seen'
    ): Promise<void> {
        const token = await this.getAccessToken(pageId);
        await this.sendAPI(pageId, token, {
            recipient: { id: recipientId },
            sender_action: action,
        });
    }

    /**
     * Get page details.
     */
    async getPageDetails(pageId: string, accessToken: string): Promise<{ name: string; category: string }> {
        const response = await fetch(`${API_BASE}/${pageId}?fields=name,category&access_token=${accessToken}`);
        if (!response.ok) return { name: 'Facebook Page', category: '' };
        const data: any = await response.json();
        return { name: data.name || 'Facebook Page', category: data.category || '' };
    }

    /**
     * Subscribe a page to webhook events.
     */
    async subscribePageToWebhook(pageId: string, accessToken: string): Promise<void> {
        const response = await fetch(`${API_BASE}/${pageId}/subscribed_apps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_token: accessToken,
                subscribed_fields: ['messages', 'messaging_postbacks', 'messaging_optins', 'message_deliveries', 'message_reads'],
            }),
        });

        if (!response.ok) {
            const data: any = await response.json();
            throw new Error(`Failed to subscribe page: ${data.error?.message || 'Unknown error'}`);
        }
    }

    // ─── Private Helpers ───────────────────────────────────────────────

    private parseMessageContent(msg: any): SocialMessageContent {
        // Quick reply
        if (msg.quick_reply) {
            return { type: 'text', text: msg.text || msg.quick_reply.payload, payload: msg.quick_reply.payload };
        }

        if (msg.text) return { type: 'text', text: msg.text };

        if (msg.attachments && msg.attachments.length > 0) {
            const att = msg.attachments[0];
            switch (att.type) {
                case 'image': return { type: 'image', media_url: att.payload?.url };
                case 'video': return { type: 'video', media_url: att.payload?.url };
                case 'audio': return { type: 'audio', media_url: att.payload?.url };
                case 'file': return { type: 'document', media_url: att.payload?.url };
                case 'location':
                    return {
                        type: 'location',
                        latitude: att.payload?.coordinates?.lat,
                        longitude: att.payload?.coordinates?.long,
                    };
                case 'fallback': return { type: 'unsupported', text: att.title || '[Unsupported content]' };
                default: return { type: 'unsupported', text: `[Unsupported: ${att.type}]` };
            }
        }

        if (msg.sticker_id) return { type: 'sticker', text: `sticker:${msg.sticker_id}` };

        return { type: 'text', text: '' };
    }

    private parseAttachments(attachments: any[]): SocialAttachment[] {
        return attachments.map((att) => ({
            type: att.type,
            url: att.payload?.url || '',
            mime_type: att.payload?.mime_type,
            size: att.payload?.size,
            file_name: att.payload?.name,
        }));
    }

    private async getAccessToken(pageId: string): Promise<string> {
        const result = await pool.query(
            `SELECT access_token FROM social_accounts WHERE account_id = $1 AND channel = 'messenger' AND connected = true`,
            [pageId]
        );
        if (result.rows.length === 0) throw new Error(`Messenger page ${pageId} not found`);
        return result.rows[0].access_token;
    }

    private async sendAPI(pageId: string, token: string, body: any): Promise<string> {
        const response = await fetch(`${API_BASE}/${pageId}/messages?access_token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data: any = await response.json();
        if (!response.ok) {
            throw new Error(`Messenger API Error [${data.error?.code || 'UNKNOWN'}]: ${data.error?.message || JSON.stringify(data)}`);
        }
        return data.message_id || '';
    }
}

export const messengerService = new MessengerService();
