/**
 * ChannelRouterService — Unified social message router.
 *
 * Central entry point that receives InboundSocialMessages from any channel,
 * routes them into conversations/contacts, and dispatches outbound messages
 * to the correct channel service.
 */
import { pool } from '../../config/db.js';
import { WhatsAppService } from './WhatsAppService.js';
import { InstagramService } from './InstagramService.js';
import { MessengerService } from './MessengerService.js';
import { IntegrationEventTrigger } from '../../modules/integrations/integration-events.service.js';
export class ChannelRouterService {
    whatsapp;
    instagram;
    messenger;
    events;
    constructor() {
        this.whatsapp = new WhatsAppService();
        this.instagram = new InstagramService();
        this.messenger = new MessengerService();
        this.events = new IntegrationEventTrigger();
    }
    /**
     * Handle an inbound message from any social channel.
     * Creates/finds contact and conversation, persists message.
     */
    async handleInbound(message) {
        // 1. Look up the social account
        const account = await this.findAccount(message.channel, message.account_id);
        if (!account) {
            throw new Error(`Social account not found: ${message.channel}/${message.account_id}`);
        }
        // 2. Find or create contact
        const contactId = await this.findOrCreateContact(account.workspace_id, message.channel, message.sender_id, message.sender_name, message.sender_avatar_url);
        // 3. Find or create conversation
        const conversationId = await this.findOrCreateConversation(account.workspace_id, message.channel, message.sender_id, message.external_thread_id, account.id, contactId, message.sender_name);
        // 4. Persist the message
        const msgResult = await pool.query(`INSERT INTO messages
         (conversation_id, sender_type, sender_id, content, message_type, metadata,
          external_message_id, external_thread_id, social_account_id, raw_payload, contact_id)
       VALUES ($1, 'visitor', $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`, [
            conversationId,
            message.sender_id,
            message.content.text || `[${message.content.type}]`,
            message.content.type === 'text' ? 'text' : message.content.type,
            JSON.stringify({
                channel: message.channel,
                media_url: message.content.media_url,
                attachments: message.attachments,
                caption: message.content.caption,
                emoji: message.content.emoji,
                payload: message.content.payload,
            }),
            message.external_message_id,
            message.external_thread_id,
            account.id,
            JSON.stringify(message.raw),
            contactId,
        ]);
        const messageId = msgResult.rows[0].id;
        // 5. Update conversation with latest message preview
        await pool.query(`UPDATE conversations
       SET last_message_preview = $1, last_message_at = $2, updated_at = CURRENT_TIMESTAMP, is_read = false
       WHERE id = $3`, [
            (message.content.text || `[${message.content.type}]`).slice(0, 200),
            message.timestamp,
            conversationId,
        ]);
        // Fire integration events (Zapier, Slack, CRM sync) — non-blocking
        this.events.fireEvent('message.received', {
            workspaceId: account.workspace_id,
            conversation: {
                id: conversationId,
                channel: message.channel,
            },
            contact: {
                name: message.sender_name,
            },
            message: {
                text: message.content.text,
            },
        }).catch(e => console.error('[ChannelRouter] Event fire error:', e.message));
        return { conversation_id: conversationId, contact_id: contactId, message_id: messageId };
    }
    /**
     * Handle a delivery receipt.
     */
    async handleDeliveryReceipt(receipt) {
        await pool.query(`INSERT INTO social_message_statuses
         (external_message_id, channel, status, error_code, error_message, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6)`, [
            receipt.external_message_id,
            receipt.channel,
            receipt.status,
            receipt.error_code || null,
            receipt.error_message || null,
            receipt.timestamp,
        ]);
    }
    /**
     * Send an outbound message via the correct channel service.
     */
    async sendMessage(outbound) {
        let externalId = '';
        const text = outbound.content.text || '';
        switch (outbound.channel) {
            case 'whatsapp':
                if (outbound.content.type === 'text') {
                    externalId = await this.whatsapp.sendText(outbound.account_id, outbound.recipient_id, text, outbound.reply_to_external_id);
                }
                else if (['image', 'video', 'audio', 'document'].includes(outbound.content.type)) {
                    externalId = await this.whatsapp.sendMedia(outbound.account_id, outbound.recipient_id, outbound.content.type, outbound.content.media_url || '', outbound.content.caption);
                }
                break;
            case 'instagram':
                if (outbound.content.type === 'text') {
                    externalId = await this.instagram.sendText(outbound.account_id, outbound.recipient_id, text);
                }
                else if (['image', 'video', 'audio', 'file'].includes(outbound.content.type)) {
                    externalId = await this.instagram.sendMedia(outbound.account_id, outbound.recipient_id, outbound.content.type, outbound.content.media_url || '');
                }
                break;
            case 'messenger':
                if (outbound.content.type === 'text') {
                    externalId = await this.messenger.sendText(outbound.account_id, outbound.recipient_id, text);
                }
                else if (['image', 'video', 'audio', 'file'].includes(outbound.content.type)) {
                    externalId = await this.messenger.sendAttachment(outbound.account_id, outbound.recipient_id, outbound.content.type, outbound.content.media_url || '');
                }
                break;
            default:
                throw new Error(`Unsupported channel: ${outbound.channel}`);
        }
        // Persist outbound message
        await pool.query(`INSERT INTO messages
         (conversation_id, sender_type, sender_id, content, message_type, external_message_id, social_account_id, metadata)
       VALUES ($1, 'agent', $2, $3, $4, $5, (SELECT id FROM social_accounts WHERE account_id = $6 AND channel = $7 LIMIT 1), $8)`, [
            outbound.conversation_id,
            outbound.sender_id || 'system',
            text || `[${outbound.content.type}]`,
            outbound.content.type === 'text' ? 'text' : outbound.content.type,
            externalId,
            outbound.account_id,
            outbound.channel,
            JSON.stringify({ channel: outbound.channel, media_url: outbound.content.media_url }),
        ]);
        return externalId;
    }
    /**
     * Connect a social account — validate and store credentials.
     */
    async connectAccount(params) {
        const result = await pool.query(`INSERT INTO social_accounts (workspace_id, channel, account_id, account_name, access_token, webhook_secret, metadata, connected)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (workspace_id, channel, account_id)
       DO UPDATE SET access_token = $5, account_name = $4, webhook_secret = $6, metadata = $7, connected = true
       RETURNING *`, [
            params.workspace_id,
            params.channel,
            params.account_id,
            params.account_name || null,
            params.access_token,
            params.webhook_secret || null,
            JSON.stringify(params.metadata || {}),
        ]);
        return result.rows[0];
    }
    /**
     * Disconnect a social account.
     */
    async disconnectAccount(accountId) {
        await pool.query(`UPDATE social_accounts SET connected = false WHERE id = $1`, [accountId]);
    }
    // ─── Private Helpers ───────────────────────────────────────────────
    async findAccount(channel, accountId) {
        const result = await pool.query(`SELECT * FROM social_accounts WHERE channel = $1 AND account_id = $2 AND connected = true`, [channel, accountId]);
        return result.rows[0] || null;
    }
    async findOrCreateContact(workspaceId, channel, senderId, senderName, avatarUrl) {
        const channelCol = `${channel}_id`;
        // Try to find existing contact
        const existing = await pool.query(`SELECT id FROM contacts WHERE workspace_id = $1 AND ${channelCol} = $2`, [workspaceId, senderId]);
        if (existing.rows.length > 0) {
            // Update last seen
            await pool.query(`UPDATE contacts SET last_seen_at = CURRENT_TIMESTAMP, name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url) WHERE id = $3`, [senderName || null, avatarUrl || null, existing.rows[0].id]);
            return existing.rows[0].id;
        }
        // Create new contact
        const result = await pool.query(`INSERT INTO contacts (workspace_id, name, avatar_url, ${channelCol})
       VALUES ($1, $2, $3, $4) RETURNING id`, [workspaceId, senderName || `${channel} User`, avatarUrl || null, senderId]);
        return result.rows[0].id;
    }
    async findOrCreateConversation(workspaceId, channel, senderId, externalThreadId, socialAccountId, contactId, visitorName) {
        // Find open conversation with this sender on this channel
        const existing = await pool.query(`SELECT id FROM conversations
       WHERE workspace_id = $1 AND channel = $2 AND contact_id = $3 AND status != 'closed'
       ORDER BY created_at DESC LIMIT 1`, [workspaceId, channel, contactId]);
        if (existing.rows.length > 0)
            return existing.rows[0].id;
        // Create new conversation
        const result = await pool.query(`INSERT INTO conversations
         (workspace_id, channel, visitor_name, status, social_account_id, external_thread_id, contact_id)
       VALUES ($1, $2, $3, 'open', $4, $5, $6) RETURNING id`, [workspaceId, channel, visitorName || `${channel} User`, socialAccountId, externalThreadId || senderId, contactId]);
        // Fire conversation.created event — non-blocking
        this.events.fireEvent('conversation.created', {
            workspaceId,
            conversation: {
                id: result.rows[0].id,
                channel,
            },
            contact: {
                name: visitorName,
            },
        }).catch(e => console.error('[ChannelRouter] Event fire error:', e.message));
        return result.rows[0].id;
    }
}
export const channelRouterService = new ChannelRouterService();
//# sourceMappingURL=ChannelRouterService.js.map