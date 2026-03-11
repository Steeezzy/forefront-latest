/**
 * Social API Routes.
 *
 * Exposes endpoints for webhook ingestion (WhatsApp, Instagram, Messenger),
 * account connection, OAuth flows, and outbound message sending.
 */
import { verifyMetaWebhook, verifyWhatsAppWebhook } from '../../middleware/social-webhook.middleware.js';
import { channelRouterService } from '../../services/social/ChannelRouterService.js';
import { metaOAuthService } from '../../services/social/MetaOAuthService.js';
import { whatsAppService } from '../../services/social/WhatsAppService.js';
import { instagramService } from '../../services/social/InstagramService.js';
import { messengerService } from '../../services/social/MessengerService.js';
import { autoReplyEngine } from '../../services/channels/AutoReplyEngine.js';
import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';
export async function socialRoutes(fastify) {
    /**
     * Fire-and-forget auto-reply after inbound message is persisted.
     * We look up the workspace_id from the social account and trigger the engine.
     */
    async function triggerAutoReply(channel, result, accountId, senderId, messageText, log) {
        try {
            // Look up workspace from account
            const acct = await pool.query(`SELECT workspace_id FROM social_accounts WHERE account_id = $1 AND channel = $2 LIMIT 1`, [accountId, channel]);
            if (!acct.rows[0])
                return;
            autoReplyEngine.processInboundMessage({
                workspaceId: acct.rows[0].workspace_id,
                conversationId: result.conversation_id,
                messageId: result.message_id,
                channel,
                visitorMessage: messageText,
                senderId,
                accountId,
                contactId: result.contact_id,
            }).catch((e) => log.error(`[AutoReply][${channel}] ${e.message}`));
        }
        catch (e) {
            log.error(`[AutoReply][${channel}] triggerAutoReply error: ${e.message}`);
        }
    }
    // ─── Webhook Endpoints (Public - secured via HMAC signature) ────────
    fastify.register(async function publicWebhooks(webhookApi) {
        // WhatsApp
        webhookApi.get('/whatsapp', { preHandler: [verifyWhatsAppWebhook] }, async (_, reply) => {
            // Logic handled in verifyWhatsAppWebhook (returns challenge on GET)
        });
        webhookApi.post('/whatsapp', { preHandler: [verifyWhatsAppWebhook] }, async (req, reply) => {
            // Respond 200 immediately to Meta
            reply.code(200).send('EVENT_RECEIVED');
            const payload = req.body;
            // 1. Process inbound messages
            const inboundMsgs = whatsAppService.parseWebhook(payload);
            for (const msg of inboundMsgs) {
                try {
                    const result = await channelRouterService.handleInbound(msg);
                    // Trigger auto-reply via RAG engine (fire-and-forget)
                    triggerAutoReply('whatsapp', result, msg.account_id, msg.sender_id, msg.content.text || '', req.log);
                }
                catch (e) {
                    req.log.error(`[WhatsApp] Failed to route inbound message: ${e.message}`);
                }
            }
            // 2. Process delivery receipts
            const receipts = whatsAppService.parseStatusUpdate(payload);
            for (const receipt of receipts) {
                try {
                    await channelRouterService.handleDeliveryReceipt(receipt);
                }
                catch (e) {
                    req.log.error(`[WhatsApp] Failed to process receipt: ${e.message}`);
                }
            }
        });
        // Instagram
        webhookApi.get('/instagram', { preHandler: [verifyMetaWebhook] }, async (_, reply) => { });
        webhookApi.post('/instagram', { preHandler: [verifyMetaWebhook] }, async (req, reply) => {
            reply.code(200).send('EVENT_RECEIVED');
            const inboundMsgs = instagramService.parseWebhook(req.body);
            for (const msg of inboundMsgs) {
                try {
                    const result = await channelRouterService.handleInbound(msg);
                    triggerAutoReply('instagram', result, msg.account_id, msg.sender_id, msg.content.text || '', req.log);
                }
                catch (e) {
                    req.log.error(`[Instagram] Failed to route inbound message: ${e.message}`);
                }
            }
        });
        // Messenger
        webhookApi.get('/messenger', { preHandler: [verifyMetaWebhook] }, async (_, reply) => { });
        webhookApi.post('/messenger', { preHandler: [verifyMetaWebhook] }, async (req, reply) => {
            reply.code(200).send('EVENT_RECEIVED');
            const payload = req.body;
            const inboundMsgs = messengerService.parseWebhook(payload);
            for (const msg of inboundMsgs) {
                try {
                    const result = await channelRouterService.handleInbound(msg);
                    triggerAutoReply('messenger', result, msg.account_id, msg.sender_id, msg.content.text || '', req.log);
                }
                catch (e) {
                    req.log.error(`[Messenger] Failed to route inbound message: ${e.message}`);
                }
            }
            const receipts = messengerService.parseDeliveryAndRead(payload);
            for (const receipt of receipts) {
                try {
                    await channelRouterService.handleDeliveryReceipt(receipt);
                }
                catch (e) {
                    req.log.error(`[Messenger] Failed to process receipt: ${e.message}`);
                }
            }
        });
    }, { prefix: '/webhooks' });
    // ─── Account Management & Outbound (Protected via Auth) ──────────────
    fastify.register(async function privateApi(api) {
        api.addHook('preHandler', authenticate);
        // List connected social accounts for a workspace
        api.get('/accounts', async (req, reply) => {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'No workspace' });
            const { channel } = req.query;
            let sql = `SELECT id, workspace_id, channel, account_id, account_name, connected, metadata, created_at, updated_at
                        FROM social_accounts WHERE workspace_id = $1`;
            const params = [workspaceId];
            if (channel) {
                sql += ` AND channel = $2`;
                params.push(channel);
            }
            sql += ` ORDER BY created_at DESC`;
            const result = await pool.query(sql, params);
            return reply.send({ data: result.rows });
        });
        // Disconnect a social account
        api.delete('/accounts/:id', async (req, reply) => {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'No workspace' });
            const { id } = req.params;
            await pool.query(`UPDATE social_accounts SET connected = false, updated_at = NOW() WHERE id = $1 AND workspace_id = $2`, [id, workspaceId]);
            return reply.send({ success: true });
        });
        // Get Auth URL for FB/IG
        api.get('/accounts/meta/auth-url', async (req, reply) => {
            const workspaceId = req.user?.workspaceId;
            const { channel } = req.query;
            if (!channel || !workspaceId)
                return reply.code(400).send({ error: 'Missing channel or workspaceId' });
            try {
                const url = await metaOAuthService.getAuthorizationUrl(workspaceId, channel);
                return reply.send({ url });
            }
            catch (e) {
                return reply.code(500).send({ error: e.message });
            }
        });
        // Handle Meta OAuth Callback
        api.get('/accounts/meta/callback', async (req, reply) => {
            const { code, state } = req.query;
            if (!code || !state)
                return reply.code(400).send({ error: 'Missing code or state' });
            try {
                const result = await metaOAuthService.handleCallback(code, state);
                return reply.send({ data: result });
            }
            catch (e) {
                return reply.code(500).send({ error: e.message });
            }
        });
        // Connect Meta Page (Messenger or Instagram)
        api.post('/accounts/meta/connect-page', async (req, reply) => {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'No workspace' });
            const { pageId, userAccessToken, channel, pageName } = req.body;
            try {
                // Exchange for never-expiring page token
                const pageToken = await metaOAuthService.exchangePageToken(pageId, userAccessToken);
                let finalAccountId = pageId;
                let finalName = pageName;
                if (channel === 'instagram') {
                    // Find the connected IG Business Account
                    const igData = await metaOAuthService.getInstagramAccountForPage(pageId, pageToken);
                    finalAccountId = igData.igAccountId;
                    finalName = igData.username;
                }
                else {
                    // Subscribe Messenger to webhooks
                    await messengerService.subscribePageToWebhook(pageId, pageToken);
                }
                const account = await channelRouterService.connectAccount({
                    workspace_id: workspaceId,
                    channel,
                    account_id: finalAccountId,
                    account_name: finalName,
                    access_token: pageToken,
                    metadata: { pageId }, // Keep FB page ID in metadata for IG connections
                });
                return reply.send({ success: true, data: account });
            }
            catch (e) {
                return reply.code(500).send({ error: e.message });
            }
        });
        // Connect WhatsApp Cloud API Account
        api.post('/accounts/whatsapp/connect', async (req, reply) => {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'No workspace' });
            const { phoneNumberId, accessToken, webhookSecret } = req.body;
            try {
                const details = await whatsAppService.getAccountDetails(phoneNumberId, accessToken);
                const account = await channelRouterService.connectAccount({
                    workspace_id: workspaceId,
                    channel: 'whatsapp',
                    account_id: phoneNumberId,
                    account_name: details.displayName,
                    access_token: accessToken,
                    webhook_secret: webhookSecret,
                    metadata: { phoneNumber: details.phoneNumber },
                });
                return reply.send({ success: true, data: account });
            }
            catch (e) {
                return reply.code(500).send({ error: e.message });
            }
        });
        // Send Outbound Message
        api.post('/send', async (req, reply) => {
            try {
                const externalId = await channelRouterService.sendMessage(req.body);
                return reply.send({ success: true, external_message_id: externalId });
            }
            catch (e) {
                return reply.code(500).send({ error: e.message });
            }
        });
    });
}
//# sourceMappingURL=social.routes.js.map