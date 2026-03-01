/**
 * ShopifyWebhookService — Processes inbound Shopify webhook payloads.
 *
 * Routes each webhook topic to the appropriate handler, upserts data
 * into the local DB, and emits events for downstream automation.
 */

import { pool } from '../../config/db.js';
import { ShopifySyncService } from './ShopifySyncService.js';
import { ShopifyApiClient } from './ShopifyApiClient.js';
import { shopifyEventEmitter } from '../../events/shopify.events.js';
import type { ShopifyWebhookTopic } from '../../types/ecommerce.types.js';

export class ShopifyWebhookService {
    private syncService: ShopifySyncService;

    constructor() {
        this.syncService = new ShopifySyncService();
    }

    /**
     * Main router — dispatches by topic.
     */
    async handleWebhook(topic: ShopifyWebhookTopic, shopDomain: string, payload: any): Promise<void> {
        // Find store
        const storeRes = await pool.query(
            `SELECT id, workspace_id, access_token FROM shopify_configs WHERE shop_domain = $1 AND is_active = true`,
            [shopDomain]
        );
        if (storeRes.rows.length === 0) {
            console.warn(`[ShopifyWebhook] Store not found for domain: ${shopDomain}`);
            return;
        }

        const store = storeRes.rows[0];

        try {
            switch (topic) {
                case 'orders/create':
                    await this.handleOrderCreate(store.id, payload);
                    break;
                case 'orders/updated':
                    await this.handleOrderUpdate(store.id, payload);
                    break;
                case 'orders/cancelled':
                    await this.handleOrderCancelled(store.id, payload);
                    break;
                case 'orders/paid':
                    await this.handleOrderPaid(store.id, payload);
                    break;
                case 'orders/fulfilled':
                    await this.handleOrderFulfilled(store.id, payload);
                    break;
                case 'customers/create':
                case 'customers/update':
                    await this.handleCustomerUpsert(store.id, payload);
                    break;
                case 'checkouts/create':
                case 'checkouts/update':
                    await this.handleCheckout(store.id, payload);
                    break;
                case 'refunds/create':
                    await this.handleRefundCreate(store.id, payload);
                    break;
                case 'fulfillments/create':
                    await this.handleFulfillmentCreate(store.id, payload);
                    break;
                default:
                    console.log(`[ShopifyWebhook] Unhandled topic: ${topic}`);
            }
        } catch (error: any) {
            console.error(`[ShopifyWebhook] Error processing ${topic} for ${shopDomain}: ${error.message}`);
            // Webhooks must always return 200, so we catch and log rather than throw
        }
    }

    /**
     * Register all webhooks for a store after OAuth install.
     */
    async registerAllWebhooks(storeId: string, shopDomain: string, accessToken: string): Promise<void> {
        const client = new ShopifyApiClient(shopDomain, accessToken);
        const baseUrl = process.env.SHOPIFY_APP_URL || 'http://localhost:5000';

        const topics: ShopifyWebhookTopic[] = [
            'orders/create', 'orders/updated', 'orders/cancelled', 'orders/fulfilled', 'orders/paid',
            'customers/create', 'customers/update',
            'checkouts/create', 'checkouts/update',
            'refunds/create', 'fulfillments/create',
        ];

        for (const topic of topics) {
            const slug = topic.replace('/', '-');
            try {
                await client.registerWebhook(topic, `${baseUrl}/api/shopify/webhooks/${slug}`);
                console.log(`[ShopifyWebhook] Registered: ${topic}`);
            } catch (error: any) {
                // Ignore "already exists" errors
                if (!error.message.includes('for this topic has already been taken')) {
                    console.error(`[ShopifyWebhook] Failed to register ${topic}: ${error.message}`);
                }
            }
        }
    }

    // ─── Topic Handlers ────────────────────────────────────────────────

    private async handleOrderCreate(storeId: string, payload: any): Promise<void> {
        await this.syncService.upsertOrder(storeId, payload);
        if (payload.customer?.id) {
            await this.syncService.linkCustomerToContact(storeId, String(payload.customer.id));
        }
        shopifyEventEmitter.emit('shopify.order.created', { order: payload, storeId });
        console.log(`[ShopifyWebhook] Order created: ${payload.name}`);
    }

    private async handleOrderUpdate(storeId: string, payload: any): Promise<void> {
        await this.syncService.upsertOrder(storeId, payload);
        shopifyEventEmitter.emit('shopify.order.updated', { order: payload, storeId });
        console.log(`[ShopifyWebhook] Order updated: ${payload.name} → ${payload.financial_status}/${payload.fulfillment_status}`);
    }

    private async handleOrderCancelled(storeId: string, payload: any): Promise<void> {
        await this.syncService.upsertOrder(storeId, payload);
        shopifyEventEmitter.emit('shopify.order.cancelled', { order: payload, storeId });
        console.log(`[ShopifyWebhook] Order cancelled: ${payload.name}`);
    }

    private async handleOrderPaid(storeId: string, payload: any): Promise<void> {
        await pool.query(
            `UPDATE shopify_orders SET financial_status = 'paid', synced_at = CURRENT_TIMESTAMP WHERE store_id = $1 AND shopify_id = $2`,
            [storeId, String(payload.id)]
        );
        shopifyEventEmitter.emit('shopify.order.paid', { order: payload, storeId });
        console.log(`[ShopifyWebhook] Order paid: ${payload.name}`);
    }

    private async handleOrderFulfilled(storeId: string, payload: any): Promise<void> {
        await this.syncService.upsertOrder(storeId, payload);
        shopifyEventEmitter.emit('shopify.order.fulfilled', { order: payload, storeId });
        console.log(`[ShopifyWebhook] Order fulfilled: ${payload.name}`);
    }

    private async handleCustomerUpsert(storeId: string, payload: any): Promise<void> {
        await this.syncService.upsertCustomer(storeId, payload);
        await this.syncService.linkCustomerToContact(storeId, String(payload.id));
        console.log(`[ShopifyWebhook] Customer upserted: ${payload.email}`);
    }

    private async handleCheckout(storeId: string, payload: any): Promise<void> {
        await this.syncService.upsertAbandonedCheckout(storeId, payload);
        shopifyEventEmitter.emit('shopify.checkout.abandoned', { checkout: payload, storeId });
        console.log(`[ShopifyWebhook] Checkout tracked: ${payload.email} — ₹${payload.total_price}`);
    }

    private async handleRefundCreate(storeId: string, payload: any): Promise<void> {
        // Find the local order UUID
        const orderRes = await pool.query(
            `SELECT id FROM shopify_orders WHERE store_id = $1 AND shopify_id = $2`, [storeId, String(payload.order_id)]
        );

        await pool.query(
            `INSERT INTO shopify_refunds (shopify_id, store_id, order_id, note, refund_line_items, transactions, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (store_id, shopify_id) DO NOTHING`,
            [
                String(payload.id), storeId,
                orderRes.rows[0]?.id || null,
                payload.note,
                JSON.stringify(payload.refund_line_items || []),
                JSON.stringify(payload.transactions || []),
                payload.created_at,
            ]
        );
        console.log(`[ShopifyWebhook] Refund created for order ${payload.order_id}`);
    }

    private async handleFulfillmentCreate(storeId: string, payload: any): Promise<void> {
        // Log fulfillment data onto the order
        const orderId = payload.order_id ? String(payload.order_id) : null;
        console.log(`[ShopifyWebhook] Fulfillment created — tracking: ${payload.tracking_number} for order ${orderId}`);
    }
}

export const shopifyWebhookService = new ShopifyWebhookService();
