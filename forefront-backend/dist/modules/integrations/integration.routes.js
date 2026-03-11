import { IntegrationService } from './integration.service.js';
import { GoogleAnalyticsService, GoogleTagManagerService } from './providers/analytics.provider.js';
import { CrmSyncManager } from './providers/crm.provider.js';
import { MarketingSyncManager } from './providers/marketing.provider.js';
import { ZapierProvider } from './providers/zapier.provider.js';
import { EcommerceManager, WordPressProvider } from './providers/ecommerce.provider.js';
import { ZendeskProvider, JudgeMeProvider } from './providers/support.provider.js';
import { SlackProvider, SlackNotificationService } from './providers/slack.provider.js';
import { integrationEvents } from './integration-events.service.js';
import { FieldMappingService } from './field-mapping.service.js';
import { authenticate } from '../auth/auth.middleware.js';
import * as crypto from 'crypto';
const integrationService = new IntegrationService();
const crmSync = new CrmSyncManager();
const marketingSync = new MarketingSyncManager();
const zapierProvider = new ZapierProvider();
const fieldMappingService = new FieldMappingService();
const ecommerceManager = new EcommerceManager();
const slackNotifications = new SlackNotificationService();
export async function integrationRoutes(fastify) {
    // ═══════════════════════════════════════════════════════════════════
    // PUBLIC — Zapier inbound webhook
    // ═══════════════════════════════════════════════════════════════════
    fastify.post('/zapier/inbound/:workspaceId', async (request, reply) => {
        const { workspaceId } = request.params;
        const apiKey = request.headers['x-integration-key'];
        if (!apiKey) {
            return reply.code(401).send({ error: 'Missing X-Integration-Key header' });
        }
        // Verify integration key
        const integration = await integrationService.get(workspaceId, 'zapier');
        if (!integration || integration.credentials?.integrationKey !== apiKey) {
            return reply.code(403).send({ error: 'Invalid integration key' });
        }
        // Log the webhook event
        await integrationService.logWebhookEvent(integration.id, 'zapier', workspaceId, 'inbound', request.body);
        return reply.send({ success: true, received: true });
    });
    // ═══════════════════════════════════════════════════════════════════
    // PUBLIC — Widget analytics event tracking
    // ═══════════════════════════════════════════════════════════════════
    fastify.post('/analytics/track', async (request, reply) => {
        const { workspaceId, eventName, visitorId, threadId, source, parameters } = request.body;
        if (!workspaceId || !eventName) {
            return reply.code(400).send({ error: 'workspaceId and eventName required' });
        }
        const integration = await integrationService.get(workspaceId, 'google_analytics');
        if (!integration || integration.status !== 'connected') {
            return reply.send({ success: true, tracked: false });
        }
        const gaService = new GoogleAnalyticsService();
        await gaService.trackEvent(workspaceId, eventName, { visitorId, threadId, source, ...parameters });
        return reply.send({ success: true, tracked: true });
    });
    // Public: get widget analytics config
    fastify.get('/analytics/widget-config/:workspaceId', async (request, reply) => {
        const { workspaceId } = request.params;
        const configs = {};
        // GA4
        const gaIntegration = await integrationService.get(workspaceId, 'google_analytics');
        if (gaIntegration && gaIntegration.status === 'connected') {
            const gaService = new GoogleAnalyticsService();
            configs.ga4 = gaService.getWidgetConfig(gaIntegration.config?.measurementId, gaIntegration.config?.enabledEvents || []);
        }
        // GTM
        const gtmIntegration = await integrationService.get(workspaceId, 'google_tag_manager');
        if (gtmIntegration && gtmIntegration.status === 'connected') {
            const gtmService = new GoogleTagManagerService();
            configs.gtm = gtmService.getWidgetConfig(gtmIntegration.config?.containerId);
        }
        return reply.send({ success: true, configs });
    });
    // ═══════════════════════════════════════════════════════════════════
    // PROTECTED ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════
    fastify.register(async function protectedRoutes(app) {
        app.addHook('onRequest', authenticate);
        // ─── List All ────────────────────────────────────────────────
        app.get('/', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const integrations = await integrationService.getAll(workspaceId);
            return reply.send({ success: true, integrations });
        });
        // ─── Get Single ──────────────────────────────────────────────
        app.get('/:type', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const integration = await integrationService.get(workspaceId, type);
            if (!integration) {
                return reply.send({ success: true, integration: null, connected: false });
            }
            // Strip credentials from response
            const { credentials, ...safe } = integration;
            return reply.send({
                success: true,
                integration: safe,
                connected: integration.status === 'connected',
            });
        });
        // ─── Connect ─────────────────────────────────────────────────
        app.post('/:type/connect', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const body = request.body;
            // Test connection first for types that support it
            const testableTypes = [
                'hubspot', 'salesforce', 'pipedrive', 'zoho', 'agile_crm', 'zendesk_sell',
                'mailchimp', 'klaviyo', 'activecampaign', 'omnisend', 'mailerlite', 'brevo',
                'woocommerce', 'bigcommerce', 'adobe_commerce', 'prestashop',
                'zendesk', 'slack',
            ];
            if (testableTypes.includes(type) && body.credentials) {
                let testResult = { success: true };
                // CRM test
                if (['hubspot', 'salesforce', 'pipedrive', 'zoho', 'agile_crm', 'zendesk_sell'].includes(type)) {
                    testResult = await crmSync.testConnection(type, body.credentials);
                }
                // Marketing test
                else if (['mailchimp', 'klaviyo', 'activecampaign', 'omnisend', 'mailerlite', 'brevo'].includes(type)) {
                    testResult = await marketingSync.testConnection(type, body.credentials);
                }
                // E-commerce test
                else if (['woocommerce', 'bigcommerce', 'adobe_commerce', 'prestashop'].includes(type)) {
                    testResult = await ecommerceManager.testConnection(type, body.credentials);
                }
                // Zendesk test
                else if (type === 'zendesk') {
                    const zd = new ZendeskProvider(body.credentials.subdomain, body.credentials.email, body.credentials.apiToken);
                    testResult = await zd.testConnection();
                }
                // Slack test
                else if (type === 'slack') {
                    const slackProvider = new SlackProvider(body.credentials);
                    testResult = await slackProvider.testConnection();
                }
                if (!testResult.success) {
                    return reply.code(400).send({
                        success: false,
                        error: `Connection test failed: ${testResult.error}`,
                    });
                }
            }
            const integration = await integrationService.connect(workspaceId, type, {
                config: body.config || {},
                credentials: body.credentials || {},
                displayName: body.displayName,
                webhookUrl: body.webhookUrl,
                metadata: body.metadata || {},
            });
            // Special: generate Zapier integration key
            if (type === 'zapier' && !integration.credentials?.integrationKey) {
                const key = await zapierProvider.generateIntegrationKey(workspaceId);
                await integrationService.connect(workspaceId, type, {
                    credentials: { ...body.credentials, integrationKey: key },
                });
            }
            return reply.send({ success: true, integration: { ...integration, credentials: undefined } });
        });
        // ─── Disconnect ──────────────────────────────────────────────
        app.delete('/:type/disconnect', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            await integrationService.disconnect(workspaceId, type);
            return reply.send({ success: true });
        });
        // ─── Update Config ──────────────────────────────────────────
        app.put('/:type/config', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const { config } = request.body;
            const integration = await integrationService.get(workspaceId, type);
            if (!integration) {
                return reply.code(404).send({ error: 'Integration not found' });
            }
            await integrationService.updateConfig(workspaceId, type, config);
            return reply.send({ success: true });
        });
        // ─── Test Connection ────────────────────────────────────────
        app.post('/:type/test', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const integration = await integrationService.get(workspaceId, type);
            if (!integration) {
                return reply.code(404).send({ error: 'Integration not connected' });
            }
            let result = { success: false, error: 'Test not supported for this type' };
            if (['hubspot', 'salesforce', 'pipedrive', 'zoho', 'agile_crm', 'zendesk_sell'].includes(type)) {
                result = await crmSync.testConnection(type, integration.credentials);
            }
            else if (['mailchimp', 'klaviyo', 'activecampaign', 'omnisend', 'mailerlite', 'brevo'].includes(type)) {
                result = await marketingSync.testConnection(type, integration.credentials);
            }
            else if (['woocommerce', 'bigcommerce', 'adobe_commerce', 'prestashop'].includes(type)) {
                result = await ecommerceManager.testConnection(type, integration.credentials);
            }
            else if (type === 'zendesk') {
                const zd = new ZendeskProvider(integration.credentials.subdomain, integration.credentials.email, integration.credentials.apiToken);
                result = await zd.testConnection();
            }
            else if (type === 'judgeme') {
                const jm = new JudgeMeProvider(integration.credentials.apiToken, integration.credentials.shopDomain);
                result = await jm.testConnection();
            }
            else if (type === 'slack') {
                const slackProvider = new SlackProvider({
                    ...integration.credentials,
                    ...integration.config,
                });
                result = await slackProvider.testConnection();
            }
            else if (type === 'shopify') {
                // Test Shopify connection by calling the Shop API with the stored access token
                try {
                    const { pool } = await import('../../config/db.js');
                    const shopifyRes = await pool.query(`SELECT shop_domain, access_token FROM shopify_configs WHERE workspace_id = $1 AND is_active = true LIMIT 1`, [workspaceId]);
                    if (shopifyRes.rows.length === 0) {
                        result = { success: false, error: 'No active Shopify store found' };
                    }
                    else {
                        const { shop_domain, access_token } = shopifyRes.rows[0];
                        const shopRes = await fetch(`https://${shop_domain}/admin/api/2024-01/shop.json`, {
                            headers: { 'X-Shopify-Access-Token': access_token }
                        });
                        if (shopRes.ok) {
                            result = { success: true };
                        }
                        else {
                            result = { success: false, error: `Shopify API returned ${shopRes.status}` };
                        }
                    }
                }
                catch (err) {
                    result = { success: false, error: err.message };
                }
            }
            if (result.success) {
                await integrationService.markSynced(workspaceId, type);
            }
            else {
                await integrationService.markError(workspaceId, type, result.error || 'Test failed');
            }
            return reply.send({ success: true, result });
        });
        // ─── CRM: Sync Contact ──────────────────────────────────────
        app.post('/crm/:type/sync-contact', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const contact = request.body;
            const integration = await integrationService.get(workspaceId, type);
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Integration not connected' });
            }
            const logId = await integrationService.createSyncLog(integration.id, 'contact_push', 'outbound');
            try {
                const result = await crmSync.syncContact(integration.id, workspaceId, type, integration.credentials, contact);
                if (result.success) {
                    await integrationService.completeSyncLog(logId, 1, 0);
                    await integrationService.markSynced(workspaceId, type);
                }
                else {
                    await integrationService.failSyncLog(logId, result.error || 'Sync failed');
                }
                return reply.send({ success: true, result });
            }
            catch (err) {
                await integrationService.failSyncLog(logId, err.message);
                return reply.code(500).send({ error: err.message });
            }
        });
        // ─── Marketing: Subscribe ───────────────────────────────────
        app.post('/marketing/:type/subscribe', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const { listId, subscriber } = request.body;
            const integration = await integrationService.get(workspaceId, type);
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Integration not connected' });
            }
            const result = await marketingSync.subscribe(integration.id, workspaceId, type, integration.credentials, listId, subscriber);
            return reply.send({ success: true, result });
        });
        // ─── Marketing: Get Lists ───────────────────────────────────
        app.get('/marketing/:type/lists', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const integration = await integrationService.get(workspaceId, type);
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Integration not connected' });
            }
            const lists = await marketingSync.getLists(type, integration.credentials);
            return reply.send({ success: true, lists });
        });
        // ─── Zapier: Webhooks ───────────────────────────────────────
        app.get('/zapier/webhooks', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const webhooks = await zapierProvider.getWebhooks(workspaceId);
            return reply.send({ success: true, webhooks });
        });
        app.post('/zapier/webhooks', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { webhookUrl, triggerEvent, flowId } = request.body;
            const integration = await integrationService.get(workspaceId, 'zapier');
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Zapier integration not connected' });
            }
            const webhookId = await zapierProvider.registerWebhook(workspaceId, integration.id, webhookUrl, triggerEvent, flowId);
            return reply.send({ success: true, webhookId });
        });
        app.delete('/zapier/webhooks/:webhookId', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { webhookId } = request.params;
            await zapierProvider.unregisterWebhook(webhookId, workspaceId);
            return reply.send({ success: true });
        });
        app.post('/zapier/test-webhook', async (request, reply) => {
            const { webhookUrl } = request.body;
            const result = await zapierProvider.testWebhook(webhookUrl);
            return reply.send({ success: true, result });
        });
        // ─── E-commerce: Order Lookup ────────────────────────────────
        app.get('/ecommerce/:type/orders', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const { email, orderId } = request.query;
            const integration = await integrationService.get(workspaceId, type);
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Integration not connected' });
            }
            if (orderId) {
                const order = await ecommerceManager.lookupOrder(type, integration.credentials, orderId);
                return reply.send({ success: true, order });
            }
            if (email) {
                const orders = await ecommerceManager.findOrders(type, integration.credentials, email);
                return reply.send({ success: true, orders });
            }
            return reply.code(400).send({ error: 'email or orderId required' });
        });
        // ─── WordPress: Widget Snippet ──────────────────────────────
        app.get('/wordpress/snippet', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const wp = new WordPressProvider();
            const widgetDomain = process.env.WIDGET_DOMAIN || 'https://widget.forefront.chat';
            const snippet = wp.getWidgetSnippet(workspaceId, widgetDomain);
            const instructions = wp.getPluginInstructions();
            return reply.send({ success: true, snippet, instructions });
        });
        // ─── Zendesk: Create Ticket ─────────────────────────────────
        app.post('/zendesk/tickets', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const integration = await integrationService.get(workspaceId, 'zendesk');
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Zendesk integration not connected' });
            }
            const zd = new ZendeskProvider(integration.credentials.subdomain, integration.credentials.email, integration.credentials.apiToken);
            const ticket = request.body;
            const result = await zd.createTicket(ticket);
            return reply.send({ success: true, result });
        });
        // ─── Analytics: Dashboard Data ──────────────────────────────
        app.get('/analytics/events', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const integration = await integrationService.get(workspaceId, 'google_analytics');
            if (!integration) {
                return reply.send({ success: true, events: [], counts: {} });
            }
            const gaService = new GoogleAnalyticsService();
            const { startDate, endDate } = request.query;
            const events = await gaService.getEvents(workspaceId, 50, startDate);
            const counts = await gaService.getEventCounts(workspaceId, startDate ? new Date(startDate) : undefined);
            return reply.send({ success: true, events, counts });
        });
        // ─── Slack: Channels ────────────────────────────────────────
        app.get('/slack/channels', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const integration = await integrationService.get(workspaceId, 'slack');
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Slack integration not connected' });
            }
            const provider = new SlackProvider({
                ...integration.credentials,
                ...integration.config,
            });
            const channels = await provider.listChannels();
            return reply.send({ success: true, channels });
        });
        // ─── Slack: Test Notification ───────────────────────────────
        app.post('/slack/test-notification', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const result = await slackNotifications.sendTestNotification(workspaceId);
            return reply.send({ success: true, result });
        });
        // ─── Event Triggers: Fire event to all integrations ─────────
        app.post('/events/fire', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { eventType, payload } = request.body;
            if (!eventType) {
                return reply.code(400).send({ error: 'eventType is required' });
            }
            const result = await integrationEvents.fireEvent(eventType, {
                workspaceId,
                ...payload,
            });
            return reply.send({ success: true, result });
        });
        // ─── Zapier: Fire trigger manually ──────────────────────────
        app.post('/zapier/fire-trigger', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { event, data } = request.body;
            const result = await zapierProvider.fireTrigger(workspaceId, event, data);
            return reply.send({ success: true, result });
        });
        // ─── CRM: Bulk Sync ─────────────────────────────────────────
        app.post('/crm/:type/bulk-sync', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const { contacts } = request.body;
            const integration = await integrationService.get(workspaceId, type);
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Integration not connected' });
            }
            const logId = await integrationService.createSyncLog(integration.id, 'bulk_contact_push', 'outbound');
            let synced = 0;
            let failed = 0;
            const errors = [];
            for (const contact of contacts.slice(0, 100)) {
                try {
                    const result = await crmSync.syncContact(integration.id, workspaceId, type, integration.credentials, contact);
                    if (result.success) {
                        synced++;
                    }
                    else {
                        failed++;
                        errors.push(`${contact.email}: ${result.error}`);
                    }
                }
                catch (err) {
                    failed++;
                    errors.push(`${contact.email}: ${err.message}`);
                }
            }
            if (failed === 0) {
                await integrationService.completeSyncLog(logId, synced, failed);
                await integrationService.markSynced(workspaceId, type);
            }
            else {
                await integrationService.failSyncLog(logId, `${failed} contacts failed: ${errors.slice(0, 3).join('; ')}`);
            }
            return reply.send({ success: true, synced, failed, errors: errors.slice(0, 10) });
        });
        // ─── CRM: Get Synced Contacts ───────────────────────────────
        app.get('/crm/:type/synced-contacts', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const { page = '1', limit = '25' } = request.query;
            const integration = await integrationService.get(workspaceId, type);
            if (!integration) {
                return reply.send({ success: true, contacts: [], total: 0 });
            }
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const { rows } = await (await import('../../config/db.js')).pool.query(`SELECT * FROM crm_synced_contacts
         WHERE integration_id = $1 AND workspace_id = $2
         ORDER BY synced_at DESC
         LIMIT $3 OFFSET $4`, [integration.id, workspaceId, parseInt(limit), offset]);
            const countResult = await (await import('../../config/db.js')).pool.query(`SELECT COUNT(*) FROM crm_synced_contacts
         WHERE integration_id = $1 AND workspace_id = $2`, [integration.id, workspaceId]);
            return reply.send({
                success: true,
                contacts: rows,
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit),
            });
        });
        // ─── Marketing: Get Subscribers ─────────────────────────────
        app.get('/marketing/:type/subscribers', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const { page = '1', limit = '25' } = request.query;
            const integration = await integrationService.get(workspaceId, type);
            if (!integration) {
                return reply.send({ success: true, subscribers: [], total: 0 });
            }
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const { rows } = await (await import('../../config/db.js')).pool.query(`SELECT * FROM marketing_subscribers
         WHERE integration_id = $1 AND workspace_id = $2
         ORDER BY subscribed_at DESC
         LIMIT $3 OFFSET $4`, [integration.id, workspaceId, parseInt(limit), offset]);
            const countResult = await (await import('../../config/db.js')).pool.query(`SELECT COUNT(*) FROM marketing_subscribers
         WHERE integration_id = $1 AND workspace_id = $2`, [integration.id, workspaceId]);
            return reply.send({
                success: true,
                subscribers: rows,
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit),
            });
        });
        // ─── Marketing: Bulk Subscribe ──────────────────────────────
        app.post('/marketing/:type/bulk-subscribe', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const { listId, subscribers } = request.body;
            const integration = await integrationService.get(workspaceId, type);
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Integration not connected' });
            }
            let subscribed = 0;
            let failed = 0;
            for (const subscriber of subscribers.slice(0, 100)) {
                try {
                    const result = await marketingSync.subscribe(integration.id, workspaceId, type, integration.credentials, listId, subscriber);
                    if (result.success)
                        subscribed++;
                    else
                        failed++;
                }
                catch {
                    failed++;
                }
            }
            return reply.send({ success: true, subscribed, failed });
        });
        // ─── E-commerce: Customer Lookup ─────────────────────────────
        app.get('/ecommerce/:type/customer', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const { email } = request.query;
            if (!email)
                return reply.code(400).send({ error: 'email is required' });
            const integration = await integrationService.get(workspaceId, type);
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Integration not connected' });
            }
            // WooCommerce has customer lookup
            if (type === 'woocommerce') {
                const { WooCommerceProvider } = await import('./providers/ecommerce.provider.js');
                const woo = new WooCommerceProvider(integration.credentials.storeUrl, integration.credentials.consumerKey, integration.credentials.consumerSecret);
                const customer = await woo.getCustomer(email);
                return reply.send({ success: true, customer });
            }
            return reply.send({ success: true, customer: null });
        });
        // ─── Judge.me: Reviews ──────────────────────────────────────
        app.get('/judgeme/reviews', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const integration = await integrationService.get(workspaceId, 'judgeme');
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Judge.me integration not connected' });
            }
            const jm = new JudgeMeProvider(integration.credentials.apiToken, integration.credentials.shopDomain);
            const { productId, email, page } = request.query;
            let reviews;
            if (email) {
                reviews = await jm.getReviewsByEmail(email);
            }
            else {
                reviews = await jm.getReviews(productId, parseInt(page || '1'));
            }
            return reply.send({ success: true, reviews });
        });
        // ─── Judge.me: Request Review ───────────────────────────────
        app.post('/judgeme/request-review', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const integration = await integrationService.get(workspaceId, 'judgeme');
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Judge.me integration not connected' });
            }
            const jm = new JudgeMeProvider(integration.credentials.apiToken, integration.credentials.shopDomain);
            const orderData = request.body;
            const result = await jm.requestReview(orderData);
            return reply.send({ success: true, result });
        });
        // ─── Zendesk: Search Tickets ────────────────────────────────
        app.get('/zendesk/tickets', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const integration = await integrationService.get(workspaceId, 'zendesk');
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Zendesk integration not connected' });
            }
            const zd = new ZendeskProvider(integration.credentials.subdomain, integration.credentials.email, integration.credentials.apiToken);
            const { email, ticketId } = request.query;
            if (ticketId) {
                const ticket = await zd.getTicket(ticketId);
                return reply.send({ success: true, ticket });
            }
            if (email) {
                const tickets = await zd.searchTicketsByEmail(email);
                return reply.send({ success: true, tickets });
            }
            return reply.code(400).send({ error: 'email or ticketId required' });
        });
        // ─── Zendesk: Add Comment ───────────────────────────────────
        app.post('/zendesk/tickets/:ticketId/comment', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { ticketId } = request.params;
            const { comment, isPublic } = request.body;
            const integration = await integrationService.get(workspaceId, 'zendesk');
            if (!integration || integration.status !== 'connected') {
                return reply.code(400).send({ error: 'Zendesk integration not connected' });
            }
            const zd = new ZendeskProvider(integration.credentials.subdomain, integration.credentials.email, integration.credentials.apiToken);
            const success = await zd.addCommentToTicket(ticketId, comment, isPublic);
            return reply.send({ success });
        });
        // ─── Integration Dashboard Summary ──────────────────────────
        app.get('/dashboard/summary', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const integrations = await integrationService.getAll(workspaceId);
            const connected = integrations.filter((i) => i.status === 'connected');
            const errored = integrations.filter((i) => i.status === 'error');
            // Get recent sync activity
            const { rows: recentSyncs } = await (await import('../../config/db.js')).pool.query(`SELECT isl.*, i.integration_type, i.display_name
         FROM integration_sync_logs isl
         JOIN integrations i ON i.id = isl.integration_id
         WHERE isl.workspace_id = $1
         ORDER BY isl.started_at DESC
         LIMIT 20`, [workspaceId]);
            // Get recent webhook events
            const { rows: recentWebhooks } = await (await import('../../config/db.js')).pool.query(`SELECT iwe.*, i.integration_type
         FROM integration_webhook_events iwe
         JOIN integrations i ON i.id = iwe.integration_id
         WHERE iwe.workspace_id = $1
         ORDER BY iwe.received_at DESC
         LIMIT 20`, [workspaceId]);
            return reply.send({
                success: true,
                summary: {
                    totalConnected: connected.length,
                    totalErrored: errored.length,
                    integrations: integrations.map((i) => ({
                        type: i.integration_type,
                        status: i.status,
                        displayName: i.display_name,
                        lastSynced: i.last_synced_at,
                        error: i.error_message,
                    })),
                    recentSyncs,
                    recentWebhooks,
                },
            });
        });
        // ─── Sync Logs ──────────────────────────────────────────────
        app.get('/:type/sync-logs', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const integration = await integrationService.get(workspaceId, type);
            if (!integration) {
                return reply.send({ success: true, logs: [] });
            }
            const { rows } = await (await import('../../config/db.js')).pool.query(`SELECT * FROM integration_sync_logs
         WHERE integration_id = $1 AND workspace_id = $2
         ORDER BY started_at DESC LIMIT 50`, [integration.id, workspaceId]);
            return reply.send({ success: true, logs: rows });
        });
        // ═══════════════════════════════════════════════════════════════
        // FIELD MAPPING — configurable source→target field mappings
        // ═══════════════════════════════════════════════════════════════
        /** Get source fields available for mapping */
        app.get('/field-mappings/source-fields', async (_request, reply) => {
            return reply.send({ success: true, fields: fieldMappingService.getSourceFields() });
        });
        /** Get default target fields for a CRM type */
        app.get('/field-mappings/:type/defaults', async (request, reply) => {
            const { type } = request.params;
            const defaults = fieldMappingService.getDefaultTargetFields(type);
            return reply.send({ success: true, defaults });
        });
        /** Get current field mappings for an integration */
        app.get('/:type/field-mappings', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const mappings = await fieldMappingService.getMappings(workspaceId, type);
            return reply.send({ success: true, mappings });
        });
        /** Save (replace) field mappings for an integration */
        app.put('/:type/field-mappings', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const { mappings } = request.body;
            if (!Array.isArray(mappings)) {
                return reply.code(400).send({ error: 'mappings must be an array' });
            }
            const saved = await fieldMappingService.saveMappings(workspaceId, type, mappings);
            return reply.send({ success: true, mappings: saved });
        });
        /** Delete a single field mapping */
        app.delete('/:type/field-mappings/:mappingId', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { mappingId } = request.params;
            await fieldMappingService.deleteMapping(workspaceId, mappingId);
            return reply.send({ success: true });
        });
        /** Reset field mappings to defaults */
        app.post('/:type/field-mappings/reset', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const mappings = await fieldMappingService.resetToDefaults(workspaceId, type);
            return reply.send({ success: true, mappings });
        });
        // ═══════════════════════════════════════════════════════════════
        // OAUTH FLOWS — HubSpot, Salesforce OAuth2 connect
        // ═══════════════════════════════════════════════════════════════
        /** Start OAuth flow — returns authorize URL */
        app.post('/oauth/:type/authorize', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { type } = request.params;
            const body = request.body || {};
            const stateToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            // Store OAuth state
            await (await import('../../config/db.js')).pool.query(`INSERT INTO integration_oauth_states (workspace_id, integration_type, state_token, redirect_url, expires_at)
         VALUES ($1, $2, $3, $4, $5)`, [workspaceId, type, stateToken, body.redirectUri || '', expiresAt]);
            let authorizeUrl = '';
            switch (type) {
                case 'hubspot': {
                    const clientId = process.env.HUBSPOT_CLIENT_ID || '';
                    const redirect = process.env.HUBSPOT_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3001'}/api/integrations/oauth/callback`;
                    const scopes = 'crm.objects.contacts.read crm.objects.contacts.write crm.objects.companies.read';
                    authorizeUrl = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirect)}&state=${stateToken}`;
                    break;
                }
                case 'salesforce': {
                    const clientId = process.env.SALESFORCE_CLIENT_ID || '';
                    const redirect = process.env.SALESFORCE_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3001'}/api/integrations/oauth/callback`;
                    authorizeUrl = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&state=${stateToken}`;
                    break;
                }
                case 'pipedrive': {
                    const clientId = process.env.PIPEDRIVE_CLIENT_ID || '';
                    const redirect = process.env.PIPEDRIVE_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3001'}/api/integrations/oauth/callback`;
                    authorizeUrl = `https://oauth.pipedrive.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&state=${stateToken}`;
                    break;
                }
                default:
                    return reply.code(400).send({ error: `OAuth not supported for ${type}` });
            }
            return reply.send({ success: true, authorizeUrl, state: stateToken });
        });
        /** OAuth callback — exchanges code for tokens */
        app.get('/oauth/callback', async (request, reply) => {
            const { code, state } = request.query;
            if (!code || !state) {
                return reply.code(400).send({ error: 'Missing code or state' });
            }
            // Look up the state token
            const stateResult = await (await import('../../config/db.js')).pool.query(`SELECT * FROM integration_oauth_states WHERE state_token = $1 AND expires_at > NOW()`, [state]);
            if (stateResult.rows.length === 0) {
                return reply.code(400).send({ error: 'Invalid or expired OAuth state' });
            }
            const oauthState = stateResult.rows[0];
            const { workspace_id, integration_type } = oauthState;
            // Clean up state token
            await (await import('../../config/db.js')).pool.query('DELETE FROM integration_oauth_states WHERE state_token = $1', [state]);
            let credentials = {};
            try {
                switch (integration_type) {
                    case 'hubspot': {
                        const tokenResp = await fetch('https://api.hubapi.com/oauth/v1/token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                grant_type: 'authorization_code',
                                client_id: process.env.HUBSPOT_CLIENT_ID || '',
                                client_secret: process.env.HUBSPOT_CLIENT_SECRET || '',
                                redirect_uri: process.env.HUBSPOT_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3001'}/api/integrations/oauth/callback`,
                                code,
                            }),
                        });
                        if (!tokenResp.ok)
                            throw new Error(`HubSpot token exchange failed: ${tokenResp.status}`);
                        const tokens = await tokenResp.json();
                        credentials = {
                            accessToken: tokens.access_token,
                            refreshToken: tokens.refresh_token,
                            expiresAt: Date.now() + tokens.expires_in * 1000,
                        };
                        break;
                    }
                    case 'salesforce': {
                        const tokenResp = await fetch('https://login.salesforce.com/services/oauth2/token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                grant_type: 'authorization_code',
                                client_id: process.env.SALESFORCE_CLIENT_ID || '',
                                client_secret: process.env.SALESFORCE_CLIENT_SECRET || '',
                                redirect_uri: process.env.SALESFORCE_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3001'}/api/integrations/oauth/callback`,
                                code,
                            }),
                        });
                        if (!tokenResp.ok)
                            throw new Error(`Salesforce token exchange failed: ${tokenResp.status}`);
                        const tokens = await tokenResp.json();
                        credentials = {
                            accessToken: tokens.access_token,
                            refreshToken: tokens.refresh_token,
                            instanceUrl: tokens.instance_url,
                        };
                        break;
                    }
                    case 'pipedrive': {
                        const tokenResp = await fetch('https://oauth.pipedrive.com/oauth/token', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Authorization': 'Basic ' + Buffer.from(`${process.env.PIPEDRIVE_CLIENT_ID}:${process.env.PIPEDRIVE_CLIENT_SECRET}`).toString('base64'),
                            },
                            body: new URLSearchParams({
                                grant_type: 'authorization_code',
                                redirect_uri: process.env.PIPEDRIVE_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3001'}/api/integrations/oauth/callback`,
                                code,
                            }),
                        });
                        if (!tokenResp.ok)
                            throw new Error(`Pipedrive token exchange failed: ${tokenResp.status}`);
                        const tokens = await tokenResp.json();
                        credentials = {
                            accessToken: tokens.access_token,
                            refreshToken: tokens.refresh_token,
                            apiToken: tokens.access_token,
                            expiresAt: Date.now() + tokens.expires_in * 1000,
                        };
                        break;
                    }
                }
                // Connect the integration
                await integrationService.connect(workspace_id, integration_type, {
                    credentials,
                    metadata: { connectedVia: 'oauth' },
                });
                // Redirect back to frontend integrations page
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                return reply.redirect(`${frontendUrl}/panel/integrations/detail?type=${integration_type}&connected=true`);
            }
            catch (err) {
                console.error(`[OAuth] ${integration_type} callback error:`, err.message);
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                return reply.redirect(`${frontendUrl}/panel/integrations?error=${encodeURIComponent(err.message)}`);
            }
        });
    });
}
//# sourceMappingURL=integration.routes.js.map