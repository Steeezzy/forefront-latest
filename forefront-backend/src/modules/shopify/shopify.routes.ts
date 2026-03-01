/**
 * Shopify API Routes.
 *
 * Exposes webhook endpoints (HMAC-verified), OAuth flow,
 * store management, data access, and conversation context.
 */

import { FastifyInstance } from 'fastify';
import { shopifyOAuthService } from '../../services/shopify/ShopifyOAuthService.js';
import { shopifyWebhookService } from '../../services/shopify/ShopifyWebhookService.js';
import { shopifySyncService } from '../../services/shopify/ShopifySyncService.js';
import { customerContextService } from '../../services/shopify/CustomerContextService.js';
import { shopifyToolsService } from '../../services/shopify/ShopifyToolsService.js';
import { ShopifyApiClient } from '../../services/shopify/ShopifyApiClient.js';
import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';
import type { ShopifyWebhookTopic } from '../../types/ecommerce.types.js';

export async function shopifyRoutes(fastify: FastifyInstance) {

    // ─── Webhook Routes (public — HMAC verified) ───────────────────────

    fastify.register(async function webhookRoutes(wh) {
        // All webhook POST routes follow the same pattern
        const webhookTopics: Array<{ slug: string; topic: ShopifyWebhookTopic }> = [
            { slug: 'orders-create', topic: 'orders/create' },
            { slug: 'orders-updated', topic: 'orders/updated' },
            { slug: 'orders-cancelled', topic: 'orders/cancelled' },
            { slug: 'orders-paid', topic: 'orders/paid' },
            { slug: 'orders-fulfilled', topic: 'orders/fulfilled' },
            { slug: 'customers-create', topic: 'customers/create' },
            { slug: 'customers-update', topic: 'customers/update' },
            { slug: 'checkouts-create', topic: 'checkouts/create' },
            { slug: 'checkouts-update', topic: 'checkouts/update' },
            { slug: 'refunds-create', topic: 'refunds/create' },
            { slug: 'fulfillments-create', topic: 'fulfillments/create' },
        ];

        for (const { slug, topic } of webhookTopics) {
            wh.post(`/${slug}`, async (req, reply) => {
                // 1. Verify HMAC
                const hmac = req.headers['x-shopify-hmac-sha256'] as string;
                const rawBody = (req as any).rawBody;
                if (!hmac || !rawBody || !shopifyOAuthService.verifyWebhookSignature(rawBody, hmac)) {
                    return reply.code(401).send({ error: 'Invalid HMAC' });
                }

                // 2. Respond 200 immediately
                reply.code(200).send('OK');

                // 3. Process async
                const shopDomain = req.headers['x-shopify-shop-domain'] as string;
                const payload = req.body;
                shopifyWebhookService.handleWebhook(topic, shopDomain, payload).catch((e) => {
                    req.log.error(`[ShopifyWebhook] ${topic}: ${e.message}`);
                });
            });
        }
    }, { prefix: '/webhooks' });

    // ─── OAuth Routes (public) ─────────────────────────────────────────

    fastify.get('/install', async (req, reply) => {
        const { shop, workspaceId } = req.query as { shop: string; workspaceId: string };
        if (!shop || !workspaceId) return reply.code(400).send({ error: 'Missing shop or workspaceId' });

        try {
            const url = await shopifyOAuthService.getInstallUrl(shop, workspaceId);
            return reply.redirect(url);
        } catch (e: any) {
            return reply.code(400).send({ error: e.message });
        }
    });

    fastify.get('/callback', async (req, reply) => {
        const params = req.query as { code: string; shop: string; state: string; hmac: string; timestamp?: string };
        if (!params.code || !params.shop) return reply.code(400).send({ error: 'Missing OAuth params' });

        try {
            const { accessToken, scopes, workspaceId } = await shopifyOAuthService.handleCallback(params);

            // Upsert store record into shopify_configs
            const storeRes = await pool.query(
                `INSERT INTO shopify_configs (workspace_id, shop_domain, access_token, scopes, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (workspace_id) DO UPDATE SET
           shop_domain = $2, access_token = $3, scopes = $4, is_active = true, installed_at = CURRENT_TIMESTAMP
         RETURNING id`,
                [workspaceId, params.shop, accessToken, scopes.join(',')]
            );
            const storeId = storeRes.rows[0].id;

            // Register webhooks + initial sync in background
            shopifyWebhookService.registerAllWebhooks(storeId, params.shop, accessToken).catch(console.error);
            shopifySyncService.initialSync(storeId, params.shop, accessToken).catch(console.error);

            return reply.send({ success: true, store_id: storeId, message: 'Shopify connected. Sync started in background.' });
        } catch (e: any) {
            return reply.code(500).send({ error: e.message });
        }
    });

    // ─── Protected Routes ──────────────────────────────────────────────

    fastify.register(async function protectedRoutes(api) {
        api.addHook('preHandler', authenticate);

        // Store management
        api.get('/stores', async (req) => {
            const { workspaceId } = req.query as { workspaceId: string };
            const res = await pool.query(
                `SELECT sc.*, sj.status as sync_status, sj.records_synced, sj.error as sync_error
         FROM shopify_configs sc
         LEFT JOIN LATERAL (
           SELECT status, records_synced, error FROM shopify_sync_jobs WHERE store_id = sc.id ORDER BY started_at DESC LIMIT 1
         ) sj ON true
         WHERE sc.workspace_id = $1`, [workspaceId]
            );
            return { data: res.rows };
        });

        api.delete('/stores/:storeId', async (req, reply) => {
            const { storeId } = req.params as { storeId: string };
            await pool.query(`UPDATE shopify_configs SET is_active = false, uninstalled_at = CURRENT_TIMESTAMP WHERE id = $1`, [storeId]);
            return reply.send({ success: true });
        });

        api.post('/stores/:storeId/sync', async (req, reply) => {
            const { storeId } = req.params as { storeId: string };
            const storeRes = await pool.query(`SELECT shop_domain, access_token FROM shopify_configs WHERE id = $1`, [storeId]);
            if (storeRes.rows.length === 0) return reply.code(404).send({ error: 'Store not found' });

            const { shop_domain, access_token } = storeRes.rows[0];
            shopifySyncService.initialSync(storeId, shop_domain, access_token).catch(console.error);
            return reply.send({ success: true, message: 'Sync started in background' });
        });

        api.get('/stores/:storeId/sync-status', async (req) => {
            const { storeId } = req.params as { storeId: string };
            const res = await pool.query(
                `SELECT * FROM shopify_sync_jobs WHERE store_id = $1 ORDER BY started_at DESC LIMIT 1`, [storeId]
            );
            return { data: res.rows[0] || null };
        });

        // Data endpoints
        api.get('/orders', async (req) => {
            const { storeId, customerId, status, limit, page } = req.query as any;
            let query = `SELECT * FROM shopify_orders WHERE store_id = $1`;
            const params: any[] = [storeId];
            let idx = 2;

            if (customerId) { query += ` AND shopify_customer_id = $${idx++}`; params.push(customerId); }
            if (status) { query += ` AND financial_status = $${idx++}`; params.push(status); }

            query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(parseInt(limit) || 20);
            params.push(((parseInt(page) || 1) - 1) * (parseInt(limit) || 20));

            const res = await pool.query(query, params);
            return { data: res.rows };
        });

        api.get('/orders/:id', async (req) => {
            const { id } = req.params as { id: string };
            const res = await pool.query(`SELECT * FROM shopify_orders WHERE id = $1`, [id]);
            return { data: res.rows[0] || null };
        });

        api.get('/customers/search', async (req) => {
            const { storeId, q } = req.query as { storeId: string; q: string };
            const res = await pool.query(
                `SELECT * FROM shopify_customers WHERE store_id = $1 AND (email ILIKE $2 OR first_name ILIKE $2 OR last_name ILIKE $2) LIMIT 20`,
                [storeId, `%${q}%`]
            );
            return { data: res.rows };
        });

        api.get('/customers/:id/context', async (req) => {
            const { id } = req.params as { id: string };
            const custRes = await pool.query(`SELECT email, store_id FROM shopify_customers WHERE id = $1`, [id]);
            if (custRes.rows.length === 0) return { data: null };

            const storeRes = await pool.query(`SELECT workspace_id FROM shopify_configs WHERE id = $1`, [custRes.rows[0].store_id]);
            const ctx = await customerContextService.getContextByEmail(custRes.rows[0].email, storeRes.rows[0]?.workspace_id);
            return { data: ctx ? customerContextService.formatContextForAgent(ctx) : null };
        });

        api.get('/products/search', async (req) => {
            const { storeId, q } = req.query as { storeId: string; q: string };
            const res = await pool.query(
                `SELECT * FROM shopify_products WHERE store_id = $1 AND (title ILIKE $2 OR vendor ILIKE $2) AND status = 'active' LIMIT 20`,
                [storeId, `%${q}%`]
            );
            return { data: res.rows };
        });

        api.post('/orders/:id/cancel', async (req, reply) => {
            const { id } = req.params as { id: string };
            const { reason } = req.body as { reason?: string };
            const orderRes = await pool.query(`SELECT shopify_id, store_id FROM shopify_orders WHERE id = $1`, [id]);
            if (orderRes.rows.length === 0) return reply.code(404).send({ error: 'Order not found' });

            const storeRes = await pool.query(`SELECT shop_domain, access_token FROM shopify_configs WHERE id = $1`, [orderRes.rows[0].store_id]);
            const client = new ShopifyApiClient(storeRes.rows[0].shop_domain, storeRes.rows[0].access_token);
            const result = await client.cancelOrder(orderRes.rows[0].shopify_id, reason);
            return reply.send({ success: true, data: result });
        });

        // Conversation context for AI
        api.get('/context/conversation/:conversationId', async (req) => {
            const { conversationId } = req.params as { conversationId: string };
            const ctx = await customerContextService.getContextByConversation(conversationId);
            return { data: ctx ? customerContextService.formatContextForAgent(ctx) : null };
        });
    });
}
