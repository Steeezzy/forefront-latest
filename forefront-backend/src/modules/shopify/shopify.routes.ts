/**
 * Shopify API Routes.
 *
 * Exposes webhook endpoints (HMAC-verified), OAuth flow,
 * store management, data access, and conversation context.
 */

import { FastifyInstance } from 'fastify';
import * as crypto from 'crypto';
import { shopifyOAuthService } from '../../services/shopify/ShopifyOAuthService.js';
import { shopifyWebhookService } from '../../services/shopify/ShopifyWebhookService.js';
import { shopifySyncService } from '../../services/shopify/ShopifySyncService.js';
import { customerContextService } from '../../services/shopify/CustomerContextService.js';
import { shopifyToolsService } from '../../services/shopify/ShopifyToolsService.js';
import { shopifyMetafieldsService } from '../../services/shopify/ShopifyMetafieldsService.js';
import { ShopifyApiClient } from '../../services/shopify/ShopifyApiClient.js';
import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';
import type { ShopifyWebhookTopic } from '../../types/ecommerce.types.js';
import { getShopifyWidgetScript } from './shopify-widget-script.js';
import { enhancedRAGService } from '../chat/enhanced-rag.service.js';
import { AgentService } from '../agent/agent.service.js';

const agentService = new AgentService();

export async function shopifyRoutes(fastify: FastifyInstance) {
    const normalizeShopDomain = (shop: string) => {
        let shopDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const adminMatch = shopDomain.match(/admin\.shopify\.com\/store\/([a-zA-Z0-9-]+)/);
        if (adminMatch) {
            return `${adminMatch[1]}.myshopify.com`;
        }
        if (!shopDomain.includes('.myshopify.com')) {
            return `${shopDomain.split('/')[0]}.myshopify.com`;
        }
        return shopDomain;
    };

    const resolvePrimaryAgentForShop = async (shop: string) => {
        const shopDomain = normalizeShopDomain(shop);
        const configRes = await pool.query(
            `SELECT workspace_id FROM shopify_configs WHERE shop_domain = $1 AND is_active = true LIMIT 1`,
            [shopDomain]
        );

        if (configRes.rows.length === 0) {
            return { shopDomain, workspaceId: null, agent: null };
        }

        const workspaceId = configRes.rows[0].workspace_id;
        const agent = await agentService.ensureAgent(
            workspaceId,
            `${shopDomain.replace('.myshopify.com', '')} Chatbot`
        );

        return { shopDomain, workspaceId, agent };
    };

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
            { slug: 'app-uninstalled', topic: 'app/uninstalled' },
            { slug: 'products-update', topic: 'products/update' },
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

    // ─── GDPR Mandatory Compliance Routes (public — HMAC verified) ────

    fastify.register(async function gdprRoutes(gdpr) {

        /** POST /gdpr/customers/data_request — Shopify customer data request */
        gdpr.post('/customers/data_request', async (req, reply) => {
            const hmac = req.headers['x-shopify-hmac-sha256'] as string;
            const rawBody = (req as any).rawBody;
            if (!hmac || !rawBody || !shopifyOAuthService.verifyWebhookSignature(rawBody, hmac)) {
                return reply.code(401).send({ error: 'Invalid HMAC' });
            }

            const payload = req.body as any;
            req.log.info(`[GDPR] Customer data request for shop=${payload?.shop_domain}, customer_id=${payload?.customer?.id}`);

            // Respond 200 immediately — process manually / async later
            return reply.code(200).send({ received: true });
        });

        /** POST /gdpr/customers/redact — Shopify customer data deletion */
        gdpr.post('/customers/redact', async (req, reply) => {
            const hmac = req.headers['x-shopify-hmac-sha256'] as string;
            const rawBody = (req as any).rawBody;
            if (!hmac || !rawBody || !shopifyOAuthService.verifyWebhookSignature(rawBody, hmac)) {
                return reply.code(401).send({ error: 'Invalid HMAC' });
            }

            const payload = req.body as any;
            req.log.info(`[GDPR] Customer redact for shop=${payload?.shop_domain}, customer_id=${payload?.customer?.id}`);

            // Delete customer-related data from local tables
            try {
                const shopDomain = payload?.shop_domain;
                const customerId = payload?.customer?.id;
                if (shopDomain && customerId) {
                    await pool.query(
                        `DELETE FROM shopify_customers WHERE store_id IN (SELECT id FROM shopify_configs WHERE shop_domain = $1) AND shopify_id = $2`,
                        [shopDomain, String(customerId)]
                    );
                }
            } catch (e: any) {
                req.log.error(`[GDPR] Customer redact DB error: ${e.message}`);
            }

            return reply.code(200).send({ received: true });
        });

        /** POST /gdpr/shop/redact — Shopify shop data deletion (48h after uninstall) */
        gdpr.post('/shop/redact', async (req, reply) => {
            const hmac = req.headers['x-shopify-hmac-sha256'] as string;
            const rawBody = (req as any).rawBody;
            if (!hmac || !rawBody || !shopifyOAuthService.verifyWebhookSignature(rawBody, hmac)) {
                return reply.code(401).send({ error: 'Invalid HMAC' });
            }

            const payload = req.body as any;
            req.log.info(`[GDPR] Shop redact for shop=${payload?.shop_domain}`);

            // Mark store as fully redacted
            try {
                const shopDomain = payload?.shop_domain;
                if (shopDomain) {
                    await pool.query(
                        `UPDATE shopify_configs SET is_active = false, access_token = NULL, uninstalled_at = CURRENT_TIMESTAMP WHERE shop_domain = $1`,
                        [shopDomain]
                    );
                }
            } catch (e: any) {
                req.log.error(`[GDPR] Shop redact DB error: ${e.message}`);
            }

            return reply.code(200).send({ received: true });
        });

    }, { prefix: '/gdpr' });

    // ─── OAuth Routes (public) ─────────────────────────────────────────

    /**
     * GET /api/shopify/resolve-agent
     * Resolves a Shopify store domain to its primary Quoston AI agentId
     * Used by the storefront app embed widget to dynamically connect.
     * CORS-enabled for theme editor and storefront access.
     */
    fastify.get('/resolve-agent', async (req, reply) => {
        try {
            const { shop } = req.query as { shop?: string };
            if (!shop) return reply.code(400).send({ error: 'Missing shop parameter' });

            // Add CORS headers for storefront/theme editor access
            reply.header('Access-Control-Allow-Origin', '*');
            reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
            reply.header('Access-Control-Allow-Headers', 'Content-Type');

            // Handle preflight
            if (req.method === 'OPTIONS') {
                return reply.code(200).send();
            }

            const { shopDomain, agent } = await resolvePrimaryAgentForShop(shop);

            if (!agent) {
                req.log.warn(`[Resolve Agent] No active shopify_configs row for shop=${shopDomain}`);
                return reply.code(404).send({ error: 'Store not integrated or inactive' });
            }

            console.log(`[Resolve Agent] Resolved for ${shopDomain}: agentId=${agent.id}, name=${agent.name}`);
            return reply.send({ success: true, agentId: agent.id, agentName: agent.name });
        } catch (error: any) {
            console.error(`[Resolve Agent] CRITICAL ERROR:`, error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });


    fastify.get('/install', async (req, reply) => {
        let { shop, workspaceId: qsWorkspaceId } = req.query as { shop?: string; workspaceId?: string };
        if (!shop) return reply.code(400).send({ error: 'Missing shop parameter' });

        // Normalize shop domain — handle all formats:
        // - https://admin.shopify.com/store/questron-7108
        // - admin.shopify.com/store/questron-7108
        // - questron-7108.myshopify.com
        // - questron-7108
        shop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const adminMatch = shop.match(/admin\.shopify\.com\/store\/([a-zA-Z0-9-]+)/);
        if (adminMatch) {
            shop = `${adminMatch[1]}.myshopify.com`;
        } else if (!shop.includes('.myshopify.com')) {
            shop = `${shop.split('/')[0]}.myshopify.com`;
        }

        // Resolve workspaceId: from query string, or from auth cookie, or auto-create
        let workspaceId = qsWorkspaceId;
        if (!workspaceId) {
            // Try to get from authenticated user's JWT
            try {
                const { verifyToken } = await import('../../utils/jwt.js');
                let token = req.cookies?.token;
                if (!token && req.headers.authorization?.startsWith('Bearer ')) {
                    token = req.headers.authorization.split(' ')[1];
                }
                if (token) {
                    const decoded = verifyToken(token) as { userId: string; workspaceId: string } | null;
                    if (decoded?.workspaceId) {
                        workspaceId = decoded.workspaceId;
                    }
                }
            } catch { /* ignore auth errors */ }
        }

        // If still no workspace, auto-resolve from the first user's workspace
        if (!workspaceId) {
            const wsRes = await pool.query(`SELECT id FROM workspaces ORDER BY created_at ASC LIMIT 1`);
            if (wsRes.rows.length > 0) {
                workspaceId = wsRes.rows[0].id;
            } else {
                workspaceId = '__auto__' + shop.replace('.myshopify.com', '');
            }
        }

        try {
            const url = await shopifyOAuthService.getInstallUrl(shop, workspaceId);
            return reply.send({ success: true, authorizeUrl: url });
        } catch (e: any) {
            return reply.code(400).send({ error: e.message });
        }
    });

    fastify.get('/callback', async (req, reply) => {
        const params = req.query as { code: string; shop: string; state: string; hmac: string; timestamp?: string };
        if (!params.code || !params.shop) return reply.code(400).send({ error: 'Missing OAuth params' });

        try {
            const { accessToken, scopes, workspaceId: rawWorkspaceId } = await shopifyOAuthService.handleCallback(params);

            let workspaceId = rawWorkspaceId;

            // Auto-link store to Quoston user based on Shopify owner email
            if (rawWorkspaceId.startsWith('__auto__')) {
                const storeName = params.shop.replace('.myshopify.com', '');

                // 1. Get shop owner email from Shopify API
                const shopRes = await fetch(`https://${params.shop}/admin/api/2024-01/shop.json`, {
                    headers: { 'X-Shopify-Access-Token': accessToken }
                });
                const shopDataResponse = await shopRes.json() as { shop?: { email?: string } };
                const ownerEmail = shopDataResponse.shop?.email;

                // 2. Check if workspace already exists for this shop
                const existingWs = await pool.query(
                    `SELECT w.id FROM workspaces w
                     JOIN shopify_configs sc ON sc.workspace_id = w.id
                     WHERE sc.shop_domain = $1 LIMIT 1`,
                    [params.shop]
                );

                if (existingWs.rows.length > 0) {
                    workspaceId = existingWs.rows[0].id;
                } else if (ownerEmail) {
                    // 3. Find matching Quoston user by email
                    const ownerRes = await pool.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [ownerEmail]);

                    if (ownerRes.rows.length > 0) {
                        const ownerId = ownerRes.rows[0].id;

                        // Use their existing workspace
                        const existingOwnerWs = await pool.query(
                            `SELECT id FROM workspaces WHERE owner_id = $1 ORDER BY created_at ASC LIMIT 1`,
                            [ownerId]
                        );

                        if (existingOwnerWs.rows.length > 0) {
                            workspaceId = existingOwnerWs.rows[0].id;
                        } else {
                            // Create workspace for this user
                            const wsRes = await pool.query(
                                `INSERT INTO workspaces (name, owner_id) VALUES ($1, $2) RETURNING id`,
                                [`Shopify: ${storeName}`, ownerId]
                            );
                            workspaceId = wsRes.rows[0].id;
                        }
                    } else {
                        // 4. No Quoston account found — in the future send an invite email here
                        console.log(`[Shopify Install] No Quoston account for ${ownerEmail}. Store: ${params.shop}`);

                        // For now, create a ghost user to capture the store, or throw
                        // Instead, we create a placeholder workspace
                        const wsRes = await pool.query(
                            `INSERT INTO workspaces (name) VALUES ($1) RETURNING id`,
                            [`Shopify: ${storeName}`]
                        );
                        workspaceId = wsRes.rows[0].id;
                    }
                }
            }

            // ── Shopify configurations setup ──
            // Upsert store record into shopify_configs
            const storeRes = await pool.query(
                `INSERT INTO shopify_configs (workspace_id, shop_domain, access_token, scopes, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (workspace_id) DO UPDATE SET
           shop_domain = EXCLUDED.shop_domain, 
           access_token = EXCLUDED.access_token, 
           scopes = EXCLUDED.scopes, 
           is_active = true, 
           installed_at = CURRENT_TIMESTAMP
         RETURNING id`,
                [workspaceId, params.shop, accessToken, scopes.join(',')]
            );
            const storeId = storeRes.rows[0].id;

            // Also upsert into generic integrations table so the dashboard shows "connected"
            try {
                await pool.query(
                    `INSERT INTO integrations (workspace_id, integration_type, status, display_name, config, metadata)
                     VALUES ($1, 'shopify', 'connected', $2, $3, $4)
                     ON CONFLICT (workspace_id, integration_type) DO UPDATE SET
                       status = 'connected',
                       display_name = $2,
                       config = $3,
                       metadata = $4,
                       updated_at = CURRENT_TIMESTAMP`,
                    [
                        workspaceId,
                        params.shop,
                        JSON.stringify({ shop_domain: params.shop, store_id: storeId }),
                        JSON.stringify({ scopes: scopes.join(','), installed_at: new Date().toISOString() })
                    ]
                );
            } catch (intErr) {
                console.error('[Shopify] Failed to upsert integrations table:', intErr);
            }

            // Register webhooks + initial sync in background
            shopifyWebhookService.registerAllWebhooks(storeId, params.shop, accessToken).catch(console.error);
            shopifySyncService.initialSync(storeId, params.shop, accessToken).catch(console.error);

            // ── Auto-sync configuration (Backend URL + Chatbot ID) ──
            try {
                // 1. Find existing agent first (prioritize the one they already built)
                const existingAgent = await pool.query(
                    `SELECT id FROM agents WHERE workspace_id = $1 AND is_active = true ORDER BY created_at ASC LIMIT 1`,
                    [workspaceId]
                );

                let agentId = existingAgent.rows[0]?.id;

                if (!agentId) {
                    // Create default agent ONLY if none exist
                    const agentRes = await pool.query(
                        `INSERT INTO agents (workspace_id, name, is_active, tone, goal, system_prompt)
                         VALUES ($1, $2, true, 'helpful', 'answer questions', 'You are a helpful support agent.')
                         RETURNING id`,
                        [workspaceId, `${params.shop.replace('.myshopify.com', '')} Chatbot`]
                    );
                    agentId = agentRes.rows[0]?.id;
                }

                if (agentId) {
                    // 2. Save full config (Chatbot ID)
                    await shopifyMetafieldsService.saveConfig(storeId, params.shop, accessToken, {
                        chatbotId: agentId
                    });
                }

                // No script tag registration here - using App Embeds for better control
            } catch (err: any) {
                console.error('[Shopify Callback] Automated setup failed:', err.message);
            }

            // Automatically redirect to the Shopify Theme Editor with the App Embed widget pre-enabled
            let redirectUrl = `https://${params.shop}/admin/apps`;
            try {
                const themeRes = await fetch(`https://${params.shop}/admin/api/2024-01/themes.json`, {
                    headers: { 'X-Shopify-Access-Token': accessToken }
                });

                if (themeRes.ok) {
                    const themeData = await themeRes.json() as { themes?: Array<{ id: number, role: string }> };
                    const mainTheme = themeData.themes?.find(t => t.role === 'main');

                    if (mainTheme) {
                        const appId = process.env.SHOPIFY_API_KEY || '97358d745c4a59a53d02a23c45d7bbdf';
                        const blockName = 'widget_embed_block';
                        redirectUrl = `https://${params.shop}/admin/themes/${mainTheme.id}/editor?context=apps&activateAppId=${appId}/${blockName}`;
                    }
                } else {
                    req.log.error(`[Shopify Install] Failed to fetch themes: ${themeRes.status}`);
                }
            } catch (themeErr: any) {
                req.log.error(`[Shopify Install] Error fetching active theme: ${themeErr.message}`);
            }

            return reply.redirect(redirectUrl);
        } catch (e: any) {
            return reply.code(500).send({ error: e.message });
        }
    });
    // ─── Widget Script Endpoint (served via ScriptTag for automatic injection) ─────────────────
    fastify.get('/widget.js', async (req, reply) => {
        const { shop } = req.query as { shop?: string };
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.SHOPIFY_APP_URL || process.env.BACKEND_URL ||
            `${req.protocol}://${req.hostname}`;
        const shopDomain = shop || '';
        const script = getShopifyWidgetScript(backendUrl, shopDomain);
        reply.type('application/javascript').send(script);
    });

    // ─── App Proxy Route ───────────────────────────────────────────────
    /**
     * GET /api/shopify/proxy*
     * Handles requests coming through the Shopify App Proxy.
     * Also handles theme editor preview requests (without signature in dev).
     */
    fastify.get('/proxy*', async (req, reply) => {
        const query = req.query as Record<string, string>;
        const signature = query.signature;
        const shop = query.shop;

        console.log('[App Proxy] Request:', { 
            path: (req.params as any)['*'], 
            shop, 
            hasSignature: !!signature,
            origin: req.headers.origin,
            referer: req.headers.referer
        });

        // Verify signature if present (required for production)
        // Skip verification in development or if no signature (theme editor preview)
        if (signature) {
            const secret = process.env.SHOPIFY_API_SECRET || '';
            if (!secret) {
                console.warn('[App Proxy] SHOPIFY_API_SECRET not set');
            } else {
                const sortedParams = Object.keys(query)
                    .filter(k => k !== 'signature')
                    .sort()
                    .map(k => `${k}=${query[k]}`)
                    .join('');

                const expectedSignature = crypto
                    .createHmac('sha256', secret)
                    .update(sortedParams)
                    .digest('hex');

                if (signature !== expectedSignature) {
                    console.error('[App Proxy] Invalid signature');
                    return reply.code(401).send({ error: 'Invalid proxy signature' });
                }
            }
        } else {
            // No signature - could be theme editor or development
            console.log('[App Proxy] No signature provided - allowing for theme editor/dev mode');
        }

        const fullPath = (req.params as any)['*'] || '';
        const path = fullPath.replace(/^\//, '');

        // CORS headers for theme editor iframe
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight
        if (req.method === 'OPTIONS') {
            return reply.code(200).send();
        }

        // 1. Unified Config Endpoint (called as /apps/questron/proxy)
        if (path === 'proxy' || path === 'proxy/' || path === '') {
            if (!shop) return reply.code(400).send({ error: 'Missing shop parameter' });

            const config = await shopifyMetafieldsService.getConfigByShopDomain(shop);
            console.log('[App Proxy] Config for shop:', shop, config);

            return reply.send({
                success: true,
                chatbot_id: config.chatbotId,
                agent_name: config.agentName || 'Support Bot',
                connected: !!config.chatbotId
            });
        }

        // 2. Chat endpoint via proxy (for CORS-free requests from storefront)
        if (path === 'chat' || path === 'chat/') {
            if (!shop) return reply.code(400).send({ error: 'Missing shop parameter' });
            
            // Forward chat request to knowledge API
            // This allows the widget to chat through the proxy avoiding CORS
            const { agentId, question, conversationId } = req.body as any;
            
            if (!agentId || !question) {
                return reply.code(400).send({ error: 'Missing agentId or question' });
            }

            try {
                // Get workspace_id from agent
                const agentResult = await pool.query('SELECT workspace_id FROM agents WHERE id = $1', [agentId]);
                if (agentResult.rows.length === 0) {
                    return reply.code(404).send({ error: 'Agent not found' });
                }
                const workspaceId = agentResult.rows[0].workspace_id;
                
                // Use enhanced RAG service for chat
                const result = await enhancedRAGService.resolveAIResponse(workspaceId, conversationId || crypto.randomUUID(), question);
                
                return reply.send({
                    success: true,
                    answer: result.content,
                    sources: result.sources || []
                });
            } catch (err: any) {
                console.error('[App Proxy] Chat error:', err);
                return reply.code(500).send({ error: 'Chat service error', message: err.message });
            }
        }

        // 3. Resolve Agent (kept for backward compat or direct use)
        if (path === 'resolve-agent' || path === 'resolve-agent/') {
            if (!shop) return reply.code(400).send({ error: 'Missing shop parameter' });
            const { agent } = await resolvePrimaryAgentForShop(shop);
            if (!agent) {
                return reply.code(404).send({ error: 'Store not integrated or inactive' });
            }
            return reply.send({ success: true, agentId: agent.id, agentName: agent.name });
        }

        return reply.code(404).send({ error: 'Not found' });
    });

    // ─── Protected Routes ──────────────────────────────────────────────

    fastify.register(async function protectedRoutes(api) {
        api.addHook('preHandler', authenticate);

        // Store management
        api.get('/stores', async (req) => {
            const user = (req as any).user as { workspaceId: string };
            const workspaceId = (req.query as { workspaceId?: string }).workspaceId || user.workspaceId;
            
            console.log('[ShopifyRoutes] GET /stores - User:', user);
            console.log('[ShopifyRoutes] GET /stores - WorkspaceId:', workspaceId);

            const res = await pool.query(
                `SELECT sc.*, sj.status as sync_status, sj.records_synced, sj.error as sync_error
         FROM shopify_configs sc
         LEFT JOIN LATERAL (
           SELECT status, records_synced, error FROM shopify_sync_jobs WHERE store_id = sc.id ORDER BY started_at DESC LIMIT 1
         ) sj ON true
         WHERE sc.workspace_id = $1`, [workspaceId]
            );
            console.log('[ShopifyRoutes] GET /stores - Results Count:', res.rows.length);
            return { success: true, stores: res.rows };
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

        // Fix 4: Connect Endpoint - used to link chatbot_id to shop manually
        api.post('/connect', async (req, reply) => {
            const { shop, chatbotId, backendUrl } = req.body as { shop: string, chatbotId: string, backendUrl?: string };
            if (!shop || !chatbotId) {
                return reply.code(400).send({ error: 'Missing shop or chatbotId' });
            }

            const cleanShop = shop.replace('https://', '').replace('http://', '').split('/')[0];

            try {
                // Find existing config or create partially
                const storeRes = await pool.query(
                    `SELECT id, access_token FROM shopify_configs WHERE shop_domain = $1 OR shop_domain = $2`,
                    [cleanShop, `${cleanShop}.myshopify.com`]
                );

                if (storeRes.rows.length === 0) {
                    return reply.code(404).send({ error: 'Store record not found. Please install the app first.' });
                }

                const store = storeRes.rows[0];
                const finalBackendUrl = backendUrl || process.env.SHOPIFY_APP_URL || process.env.BACKEND_URL || '';

                await shopifyMetafieldsService.saveConfig(store.id, cleanShop, store.access_token, {
                    chatbotId: chatbotId
                });

                return reply.send({ success: true, message: 'Connected successfully' });
            } catch (err: any) {
                return reply.code(500).send({ error: err.message });
            }
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

        // ─── Refund Route ──────────────────────────────────────────────
        api.post('/orders/:id/refund', async (req, reply) => {
            const { id } = req.params as { id: string };
            const { reason, amount, restock, notify, line_items } = req.body as {
                reason?: string; amount?: number; restock?: boolean; notify?: boolean;
                line_items?: Array<{ line_item_id: string; quantity: number }>;
            };

            const orderRes = await pool.query(`SELECT shopify_id, store_id, line_items as order_line_items FROM shopify_orders WHERE id = $1 OR shopify_id = $1`, [id]);
            if (orderRes.rows.length === 0) return reply.code(404).send({ error: 'Order not found' });

            const storeRes = await pool.query(`SELECT shop_domain, access_token FROM shopify_configs WHERE id = $1`, [orderRes.rows[0].store_id]);
            if (storeRes.rows.length === 0) return reply.code(404).send({ error: 'Store not found' });

            const client = new ShopifyApiClient(storeRes.rows[0].shop_domain, storeRes.rows[0].access_token);
            const shopifyOrderId = orderRes.rows[0].shopify_id;

            // Build line items for refund
            let refundLineItems = line_items;
            if (!refundLineItems) {
                // Full refund: all line items
                const oLineItems = orderRes.rows[0].order_line_items || [];
                refundLineItems = oLineItems.map((li: any) => ({ line_item_id: String(li.id), quantity: li.quantity }));
            }

            try {
                const calculated = await client.calculateRefund(shopifyOrderId, refundLineItems);
                if (notify !== undefined) calculated.notify = notify;
                if (reason) calculated.note = reason;
                if (restock !== false) {
                    (calculated.refund_line_items || []).forEach((rli: any) => { rli.restock_type = 'return'; });
                }
                const result = await client.createRefund(shopifyOrderId, calculated);
                return reply.send({ success: true, data: result });
            } catch (e: any) {
                return reply.code(400).send({ error: e.message });
            }
        });

        // ─── Update Address Route ──────────────────────────────────────────────
        api.post('/orders/:id/address', async (req, reply) => {
            const { id } = req.params as { id: string };
            const { address } = req.body as { address: any };

            const orderRes = await pool.query(`SELECT shopify_id, store_id FROM shopify_orders WHERE id = $1 OR shopify_id = $1`, [id]);
            if (orderRes.rows.length === 0) return reply.code(404).send({ error: 'Order not found' });

            const storeRes = await pool.query(`SELECT shop_domain, access_token FROM shopify_configs WHERE id = $1`, [orderRes.rows[0].store_id]);
            if (storeRes.rows.length === 0) return reply.code(404).send({ error: 'Store not found' });

            const client = new ShopifyApiClient(storeRes.rows[0].shop_domain, storeRes.rows[0].access_token);
            try {
                const result = await client.updateOrderAddress(orderRes.rows[0].shopify_id, address);
                // Background sync updated order back to local DB
                const ShopifyWebhookService = require('../../services/shopify/ShopifyWebhookService').ShopifyWebhookService;
                const webhookService = new ShopifyWebhookService();
                webhookService.handleOrderUpdate(storeRes.rows[0].shop_domain, result).catch(console.error);

                return reply.send({ success: true, data: result });
            } catch (e: any) {
                return reply.code(400).send({ error: e.message });
            }
        });

        // ─── Cart Data Route ───────────────────────────────────────────
        api.get('/cart/:conversationId', async (req) => {
            const { conversationId } = req.params as { conversationId: string };

            // Cart data is stored via widget JS postMessage. Lookup by conversation.
            const res = await pool.query(
                `SELECT cart_data FROM conversations WHERE id = $1`, [conversationId]
            );
            const cartData = res.rows[0]?.cart_data;
            if (!cartData || !cartData.items || cartData.items.length === 0) {
                return { data: null };
            }
            return { data: cartData };
        });

        // ─── Products List Route ───────────────────────────────────────
        api.get('/products', async (req) => {
            const { storeId, limit, q } = req.query as { storeId: string; limit?: string; q?: string };

            let query = `SELECT id, shopify_id, title, handle, vendor, product_type, status,
                tags, variants, images, created_at, updated_at
                FROM shopify_products WHERE store_id = $1 AND status = 'active'`;
            const params: any[] = [storeId];
            let idx = 2;

            if (q) {
                query += ` AND (title ILIKE $${idx} OR vendor ILIKE $${idx} OR product_type ILIKE $${idx})`;
                params.push(`%${q}%`);
                idx++;
            }

            query += ` ORDER BY title ASC LIMIT $${idx}`;
            params.push(parseInt(limit || '50'));

            const res = await pool.query(query, params);

            // Flatten product data for frontend
            const products = res.rows.map((p: any) => {
                const firstVariant = (p.variants || [])[0] || {};
                const firstImage = (p.images || [])[0] || {};
                return {
                    ...p,
                    price: firstVariant.price || '0.00',
                    compare_at_price: firstVariant.compare_at_price || null,
                    currency: '$',
                    inventory_quantity: firstVariant.inventory_quantity ?? null,
                    image_url: firstImage.src || null,
                };
            });

            return { data: products };
        });

        // ─── Coupon / Discount Code Creation ───────────────────────────
        api.post('/coupons', async (req, reply) => {
            const { storeId, discountType, discountValue, minPurchase, code, usageLimit, startsAt, endsAt } = req.body as {
                storeId: string; discountType: 'percentage' | 'fixed_amount';
                discountValue: number; minPurchase?: number;
                code?: string; usageLimit?: number;
                startsAt?: string; endsAt?: string;
            };

            const storeRes = await pool.query(`SELECT shop_domain, access_token FROM shopify_configs WHERE id = $1`, [storeId]);
            if (storeRes.rows.length === 0) return reply.code(404).send({ error: 'Store not found' });

            const client = new ShopifyApiClient(storeRes.rows[0].shop_domain, storeRes.rows[0].access_token);
            const couponCode = code || `FF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            try {
                // 1. Create a Price Rule
                const priceRuleBody: any = {
                    price_rule: {
                        title: couponCode,
                        target_type: 'line_item',
                        target_selection: 'all',
                        allocation_method: 'across',
                        value_type: discountType,
                        value: discountType === 'percentage' ? `-${discountValue}` : `-${discountValue}`,
                        customer_selection: 'all',
                        starts_at: startsAt || new Date().toISOString(),
                    },
                };
                if (endsAt) priceRuleBody.price_rule.ends_at = endsAt;
                if (usageLimit) priceRuleBody.price_rule.usage_limit = usageLimit;
                if (minPurchase) {
                    priceRuleBody.price_rule.prerequisite_subtotal_range = { greater_than_or_equal_to: String(minPurchase) };
                }

                const prData = await (client as any).post('/price_rules.json', priceRuleBody);
                const priceRuleId = prData.price_rule.id;

                // 2. Create a Discount Code for the price rule
                const dcData = await (client as any).post(`/price_rules/${priceRuleId}/discount_codes.json`, {
                    discount_code: { code: couponCode },
                });

                return reply.send({
                    success: true,
                    data: {
                        code: couponCode,
                        price_rule_id: priceRuleId,
                        discount_code_id: dcData.discount_code.id,
                        value: discountValue,
                        type: discountType,
                    },
                });
            } catch (e: any) {
                return reply.code(400).send({ error: e.message });
            }
        });

        // Conversation context for AI
        api.get('/context/conversation/:conversationId', async (req) => {
            const { conversationId } = req.params as { conversationId: string };
            const ctx = await customerContextService.getContextByConversation(conversationId);
            return { data: ctx ? customerContextService.formatContextForAgent(ctx) : null };
        });
    });
}
