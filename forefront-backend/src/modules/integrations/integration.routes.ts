/**
 * Integration Routes
 *
 * API endpoints for managing all 27 integrations.
 * All protected routes require Clerk auth with workspaceId.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { IntegrationService, IntegrationType } from './integration.service.js';
import { GoogleAnalyticsService, GoogleTagManagerService } from './providers/analytics.provider.js';
import { CrmSyncManager } from './providers/crm.provider.js';
import { MarketingSyncManager } from './providers/marketing.provider.js';
import { ZapierProvider } from './providers/zapier.provider.js';
import { EcommerceManager, WordPressProvider } from './providers/ecommerce.provider.js';
import { ZendeskProvider, JudgeMeProvider } from './providers/support.provider.js';
import { authenticate } from '../auth/auth.middleware.js';

const integrationService = new IntegrationService();
const crmSync = new CrmSyncManager();
const marketingSync = new MarketingSyncManager();
const zapierProvider = new ZapierProvider();
const ecommerceManager = new EcommerceManager();

export async function integrationRoutes(fastify: FastifyInstance) {

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC — Zapier inbound webhook
  // ═══════════════════════════════════════════════════════════════════

  fastify.post('/zapier/inbound/:workspaceId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const apiKey = request.headers['x-integration-key'] as string;

    if (!apiKey) {
      return reply.code(401).send({ error: 'Missing X-Integration-Key header' });
    }

    // Verify integration key
    const integration = await integrationService.get(workspaceId, 'zapier');
    if (!integration || integration.credentials?.integrationKey !== apiKey) {
      return reply.code(403).send({ error: 'Invalid integration key' });
    }

    // Log the webhook event
    await integrationService.logWebhookEvent(
      integration.id, 'zapier', workspaceId, 'inbound', request.body as any
    );

    return reply.send({ success: true, received: true });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC — Widget analytics event tracking
  // ═══════════════════════════════════════════════════════════════════

  fastify.post('/analytics/track', async (request: FastifyRequest, reply: FastifyReply) => {
    const { workspaceId, eventName, visitorId, threadId, source, parameters } =
      request.body as any;

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
  fastify.get('/analytics/widget-config/:workspaceId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { workspaceId } = request.params as { workspaceId: string };

    const configs: any = {};

    // GA4
    const gaIntegration = await integrationService.get(workspaceId, 'google_analytics');
    if (gaIntegration && gaIntegration.status === 'connected') {
      const gaService = new GoogleAnalyticsService();
      configs.ga4 = gaService.getWidgetConfig(
        gaIntegration.config?.measurementId,
        gaIntegration.config?.enabledEvents || []
      );
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

    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const integrations = await integrationService.getAll(workspaceId);
      return reply.send({ success: true, integrations });
    });

    // ─── Get Single ──────────────────────────────────────────────

    app.get('/:type', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { type } = request.params as { type: IntegrationType };
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

    app.post('/:type/connect', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { type } = request.params as { type: IntegrationType };
      const body = request.body as any;

      // Test connection first for types that support it
      const testableTypes = [
        'hubspot', 'salesforce', 'pipedrive', 'zoho', 'agile_crm', 'zendesk_sell',
        'mailchimp', 'klaviyo', 'activecampaign', 'omnisend', 'mailerlite', 'brevo',
        'woocommerce', 'bigcommerce', 'adobe_commerce', 'prestashop',
        'zendesk',
      ];

      if (testableTypes.includes(type) && body.credentials) {
        let testResult: { success: boolean; error?: string } = { success: true };

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
          const zd = new ZendeskProvider(
            body.credentials.subdomain,
            body.credentials.email,
            body.credentials.apiToken
          );
          testResult = await zd.testConnection();
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

    app.delete('/:type/disconnect', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { type } = request.params as { type: IntegrationType };
      await integrationService.disconnect(workspaceId, type);
      return reply.send({ success: true });
    });

    // ─── Update Config ──────────────────────────────────────────

    app.put('/:type/config', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { type } = request.params as { type: IntegrationType };
      const { config } = request.body as { config: Record<string, any> };

      const integration = await integrationService.get(workspaceId, type);
      if (!integration) {
        return reply.code(404).send({ error: 'Integration not found' });
      }

      await integrationService.updateConfig(workspaceId, type, config);
      return reply.send({ success: true });
    });

    // ─── Test Connection ────────────────────────────────────────

    app.post('/:type/test', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { type } = request.params as { type: IntegrationType };
      const integration = await integrationService.get(workspaceId, type);

      if (!integration) {
        return reply.code(404).send({ error: 'Integration not connected' });
      }

      let result: { success: boolean; error?: string } = { success: false, error: 'Test not supported for this type' };

      if (['hubspot', 'salesforce', 'pipedrive', 'zoho', 'agile_crm', 'zendesk_sell'].includes(type)) {
        result = await crmSync.testConnection(type, integration.credentials);
      } else if (['mailchimp', 'klaviyo', 'activecampaign', 'omnisend', 'mailerlite', 'brevo'].includes(type)) {
        result = await marketingSync.testConnection(type, integration.credentials);
      } else if (['woocommerce', 'bigcommerce', 'adobe_commerce', 'prestashop'].includes(type)) {
        result = await ecommerceManager.testConnection(type, integration.credentials);
      } else if (type === 'zendesk') {
        const zd = new ZendeskProvider(
          integration.credentials.subdomain,
          integration.credentials.email,
          integration.credentials.apiToken
        );
        result = await zd.testConnection();
      } else if (type === 'judgeme') {
        const jm = new JudgeMeProvider(
          integration.credentials.apiToken,
          integration.credentials.shopDomain
        );
        result = await jm.testConnection();
      }

      if (result.success) {
        await integrationService.markSynced(workspaceId, type);
      } else {
        await integrationService.markError(workspaceId, type, result.error || 'Test failed');
      }

      return reply.send({ success: true, result });
    });

    // ─── CRM: Sync Contact ──────────────────────────────────────

    app.post('/crm/:type/sync-contact', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { type } = request.params as { type: string };
      const contact = request.body as any;

      const integration = await integrationService.get(workspaceId, type as IntegrationType);
      if (!integration || integration.status !== 'connected') {
        return reply.code(400).send({ error: 'Integration not connected' });
      }

      const logId = await integrationService.createSyncLog(integration.id, 'contact_push', 'outbound');

      try {
        const result = await crmSync.syncContact(
          integration.id, workspaceId, type, integration.credentials, contact
        );

        if (result.success) {
          await integrationService.completeSyncLog(logId, 1, 0);
          await integrationService.markSynced(workspaceId, type as IntegrationType);
        } else {
          await integrationService.failSyncLog(logId, result.error || 'Sync failed');
        }

        return reply.send({ success: true, result });
      } catch (err: any) {
        await integrationService.failSyncLog(logId, err.message);
        return reply.code(500).send({ error: err.message });
      }
    });

    // ─── Marketing: Subscribe ───────────────────────────────────

    app.post('/marketing/:type/subscribe', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { type } = request.params as { type: string };
      const { listId, subscriber } = request.body as { listId: string; subscriber: any };

      const integration = await integrationService.get(workspaceId, type as IntegrationType);
      if (!integration || integration.status !== 'connected') {
        return reply.code(400).send({ error: 'Integration not connected' });
      }

      const result = await marketingSync.subscribe(
        integration.id, workspaceId, type, integration.credentials, listId, subscriber
      );

      return reply.send({ success: true, result });
    });

    // ─── Marketing: Get Lists ───────────────────────────────────

    app.get('/marketing/:type/lists', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { type } = request.params as { type: string };

      const integration = await integrationService.get(workspaceId, type as IntegrationType);
      if (!integration || integration.status !== 'connected') {
        return reply.code(400).send({ error: 'Integration not connected' });
      }

      const lists = await marketingSync.getLists(type, integration.credentials);
      return reply.send({ success: true, lists });
    });

    // ─── Zapier: Webhooks ───────────────────────────────────────

    app.get('/zapier/webhooks', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const webhooks = await zapierProvider.getWebhooks(workspaceId);
      return reply.send({ success: true, webhooks });
    });

    app.post('/zapier/webhooks', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { webhookUrl, triggerEvent, flowId } = request.body as any;

      const integration = await integrationService.get(workspaceId, 'zapier');
      if (!integration || integration.status !== 'connected') {
        return reply.code(400).send({ error: 'Zapier integration not connected' });
      }

      const webhookId = await zapierProvider.registerWebhook(
        workspaceId, integration.id, webhookUrl, triggerEvent, flowId
      );

      return reply.send({ success: true, webhookId });
    });

    app.delete('/zapier/webhooks/:webhookId', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { webhookId } = request.params as { webhookId: string };
      await zapierProvider.unregisterWebhook(webhookId, workspaceId);
      return reply.send({ success: true });
    });

    app.post('/zapier/test-webhook', async (request: FastifyRequest, reply: FastifyReply) => {
      const { webhookUrl } = request.body as { webhookUrl: string };
      const result = await zapierProvider.testWebhook(webhookUrl);
      return reply.send({ success: true, result });
    });

    // ─── E-commerce: Order Lookup ────────────────────────────────

    app.get('/ecommerce/:type/orders', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { type } = request.params as { type: string };
      const { email, orderId } = request.query as { email?: string; orderId?: string };

      const integration = await integrationService.get(workspaceId, type as IntegrationType);
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

    app.get('/wordpress/snippet', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const wp = new WordPressProvider();
      const widgetDomain = process.env.WIDGET_DOMAIN || 'https://widget.forefront.chat';
      const snippet = wp.getWidgetSnippet(workspaceId, widgetDomain);
      const instructions = wp.getPluginInstructions();

      return reply.send({ success: true, snippet, instructions });
    });

    // ─── Zendesk: Create Ticket ─────────────────────────────────

    app.post('/zendesk/tickets', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const integration = await integrationService.get(workspaceId, 'zendesk');
      if (!integration || integration.status !== 'connected') {
        return reply.code(400).send({ error: 'Zendesk integration not connected' });
      }

      const zd = new ZendeskProvider(
        integration.credentials.subdomain,
        integration.credentials.email,
        integration.credentials.apiToken
      );

      const ticket = request.body as any;
      const result = await zd.createTicket(ticket);
      return reply.send({ success: true, result });
    });

    // ─── Analytics: Dashboard Data ──────────────────────────────

    app.get('/analytics/events', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const integration = await integrationService.get(workspaceId, 'google_analytics');
      if (!integration) {
        return reply.send({ success: true, events: [], counts: {} });
      }

      const gaService = new GoogleAnalyticsService();

      const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };
      const events = await gaService.getEvents(workspaceId, 50, startDate);
      const counts = await gaService.getEventCounts(workspaceId, startDate ? new Date(startDate) : undefined);

      return reply.send({ success: true, events, counts });
    });

    // ─── Sync Logs ──────────────────────────────────────────────

    app.get('/:type/sync-logs', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { type } = request.params as { type: IntegrationType };
      const integration = await integrationService.get(workspaceId, type);
      if (!integration) {
        return reply.send({ success: true, logs: [] });
      }

      const { rows } = await (await import('../../config/db.js')).pool.query(
        `SELECT * FROM integration_sync_logs
         WHERE integration_id = $1 AND workspace_id = $2
         ORDER BY started_at DESC LIMIT 50`,
        [integration.id, workspaceId]
      );

      return reply.send({ success: true, logs: rows });
    });
  });
}
