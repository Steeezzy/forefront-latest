/**
 * ShopifyToolsService — AI Function Calling tools for Shopify.
 *
 * Registers Shopify-specific tools into the ToolRegistryService
 * so Lyro can query orders, check product availability, initiate
 * refunds, and create draft orders via function calling.
 */

import { pool } from '../../config/db.js';
import { ShopifyApiClient } from './ShopifyApiClient.js';

export class ShopifyToolsService {

    /**
     * Get all tool definitions for OpenAI function calling schema.
     */
    getToolDefinitions(): Array<{ name: string; description: string; parameters: object }> {
        return [
            {
                name: 'get_order_status',
                description: 'Look up a Shopify order by order number (e.g. #1001) or order ID. Returns order status, items, fulfillment, and tracking info.',
                parameters: {
                    type: 'object',
                    properties: {
                        order_number: { type: 'string', description: 'Order number like #1001 or 1001' },
                        order_id: { type: 'string', description: 'Shopify order ID' },
                    },
                },
            },
            {
                name: 'get_customer_orders',
                description: 'Get recent orders for a customer by email address.',
                parameters: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', description: 'Customer email address' },
                        limit: { type: 'number', description: 'Max orders to return (default 3)' },
                    },
                    required: ['email'],
                },
            },
            {
                name: 'track_shipment',
                description: 'Get tracking info for an order — tracking number, carrier, and tracking URL.',
                parameters: {
                    type: 'object',
                    properties: {
                        order_number: { type: 'string', description: 'Order number or ID' },
                    },
                    required: ['order_number'],
                },
            },
            {
                name: 'check_product_availability',
                description: 'Check inventory and price for a product by title or SKU.',
                parameters: {
                    type: 'object',
                    properties: {
                        product_title: { type: 'string', description: 'Product title to search' },
                        sku: { type: 'string', description: 'Product SKU' },
                    },
                },
            },
            {
                name: 'cancel_order',
                description: 'Cancel a Shopify order if eligible (not already fulfilled or refunded).',
                parameters: {
                    type: 'object',
                    properties: {
                        order_number: { type: 'string', description: 'Order number to cancel' },
                        reason: { type: 'string', description: 'Cancellation reason' },
                    },
                    required: ['order_number'],
                },
            },
            {
                name: 'initiate_refund',
                description: 'Initiate a refund for an order. Calculates refund amount and processes it.',
                parameters: {
                    type: 'object',
                    properties: {
                        order_number: { type: 'string', description: 'Order number to refund' },
                        reason: { type: 'string', description: 'Refund reason' },
                    },
                    required: ['order_number'],
                },
            },
        ];
    }

    /**
     * Execute a tool by name.
     */
    async executeTool(toolName: string, args: Record<string, any>, workspaceId: string): Promise<string> {
        switch (toolName) {
            case 'get_order_status': return this.getOrderStatus(args, workspaceId);
            case 'get_customer_orders': return this.getCustomerOrders(args, workspaceId);
            case 'track_shipment': return this.trackShipment(args, workspaceId);
            case 'check_product_availability': return this.checkAvailability(args, workspaceId);
            case 'cancel_order': return this.cancelOrder(args, workspaceId);
            case 'initiate_refund': return this.initiateRefund(args, workspaceId);
            default: return `Unknown tool: ${toolName}`;
        }
    }

    // ─── Tool Implementations ──────────────────────────────────────────

    private async getOrderStatus(args: any, workspaceId: string): Promise<string> {
        const storeId = await this.getStoreId(workspaceId);
        if (!storeId) return 'No Shopify store connected to this workspace.';

        const orderNum = (args.order_number || '').replace('#', '');
        let query = `SELECT * FROM shopify_orders WHERE store_id = $1`;
        const params: any[] = [storeId];

        if (orderNum) {
            query += ` AND (order_number = $2 OR name ILIKE $2)`;
            params.push(orderNum.includes('#') ? orderNum : `%${orderNum}%`);
        } else if (args.order_id) {
            query += ` AND shopify_id = $2`;
            params.push(args.order_id);
        } else {
            return 'Please provide an order number or order ID.';
        }

        const res = await pool.query(query + ' LIMIT 1', params);
        if (res.rows.length === 0) return `Order ${args.order_number || args.order_id} not found.`;

        const o = res.rows[0];
        const items = (o.line_items || []).map((li: any) => `${li.title} x${li.quantity} (₹${li.price})`).join(', ');

        return `Order ${o.name}: Payment ${o.financial_status}, Shipping ${o.fulfillment_status || 'not shipped'}. Total: ₹${o.total_price}. Items: ${items}`;
    }

    private async getCustomerOrders(args: any, workspaceId: string): Promise<string> {
        const storeId = await this.getStoreId(workspaceId);
        if (!storeId) return 'No Shopify store connected.';

        const custRes = await pool.query(
            `SELECT shopify_id FROM shopify_customers WHERE store_id = $1 AND email = $2`, [storeId, args.email]
        );
        if (custRes.rows.length === 0) return `No customer found with email ${args.email}.`;

        const limit = args.limit || 3;
        const orders = await pool.query(
            `SELECT name, total_price, financial_status, fulfillment_status, created_at
       FROM shopify_orders WHERE store_id = $1 AND shopify_customer_id = $2 ORDER BY created_at DESC LIMIT $3`,
            [storeId, custRes.rows[0].shopify_id, limit]
        );

        if (orders.rows.length === 0) return `No orders found for ${args.email}.`;

        return orders.rows.map((o: any) =>
            `${o.name} — ₹${o.total_price} — ${o.financial_status}/${o.fulfillment_status || 'not shipped'} — ${new Date(o.created_at).toLocaleDateString()}`
        ).join('\n');
    }

    private async trackShipment(args: any, workspaceId: string): Promise<string> {
        const storeId = await this.getStoreId(workspaceId);
        if (!storeId) return 'No Shopify store connected.';

        const orderNum = (args.order_number || '').replace('#', '');
        const orderRes = await pool.query(
            `SELECT shopify_id, name FROM shopify_orders WHERE store_id = $1 AND (order_number::text = $2 OR name ILIKE $3) LIMIT 1`,
            [storeId, orderNum, `%${orderNum}%`]
        );
        if (orderRes.rows.length === 0) return `Order ${args.order_number} not found.`;

        // Check fulfillment data in raw payload
        const fullOrder = await pool.query(`SELECT raw FROM shopify_orders WHERE store_id = $1 AND shopify_id = $2`, [storeId, orderRes.rows[0].shopify_id]);
        const raw = fullOrder.rows[0]?.raw || {};
        const fulfillments = raw.fulfillments || [];

        if (fulfillments.length === 0) return `Order ${orderRes.rows[0].name} has not been shipped yet.`;

        return fulfillments.map((f: any) =>
            `Tracking: ${f.tracking_company || 'N/A'} — ${f.tracking_number || 'N/A'} — ${f.tracking_url || 'No URL'} — Status: ${f.status}`
        ).join('\n');
    }

    private async checkAvailability(args: any, workspaceId: string): Promise<string> {
        const storeId = await this.getStoreId(workspaceId);
        if (!storeId) return 'No Shopify store connected.';

        let query = `SELECT title, variants FROM shopify_products WHERE store_id = $1 AND status = 'active'`;
        const params: any[] = [storeId];

        if (args.product_title) {
            query += ` AND title ILIKE $2`;
            params.push(`%${args.product_title}%`);
        } else if (args.sku) {
            query += ` AND variants::text ILIKE $2`;
            params.push(`%${args.sku}%`);
        } else {
            return 'Please provide a product title or SKU.';
        }

        const res = await pool.query(query + ' LIMIT 5', params);
        if (res.rows.length === 0) return 'No matching products found.';

        return res.rows.map((p: any) => {
            const variants = (p.variants || []).map((v: any) => `${v.title}: ₹${v.price} (${v.inventory_quantity || 0} in stock)`).join(', ');
            return `${p.title}: ${variants}`;
        }).join('\n');
    }

    private async cancelOrder(args: any, workspaceId: string): Promise<string> {
        const storeId = await this.getStoreId(workspaceId);
        if (!storeId) return 'No Shopify store connected.';

        const orderNum = (args.order_number || '').replace('#', '');
        const orderRes = await pool.query(
            `SELECT shopify_id, name, financial_status, fulfillment_status FROM shopify_orders WHERE store_id = $1 AND (order_number::text = $2 OR name ILIKE $3) LIMIT 1`,
            [storeId, orderNum, `%${orderNum}%`]
        );
        if (orderRes.rows.length === 0) return `Order not found.`;

        const o = orderRes.rows[0];
        if (o.financial_status === 'refunded') return `Order ${o.name} is already refunded and cannot be cancelled.`;
        if (o.fulfillment_status === 'fulfilled') return `Order ${o.name} is already fulfilled and cannot be cancelled.`;

        // Call Shopify API
        const store = await this.getStoreInfo(storeId);
        if (!store) return 'Store config not found.';

        const client = new ShopifyApiClient(store.shop_domain, store.access_token);
        await client.cancelOrder(o.shopify_id, args.reason);

        await pool.query(
            `UPDATE shopify_orders SET financial_status = 'voided', cancelled_at = CURRENT_TIMESTAMP WHERE store_id = $1 AND shopify_id = $2`,
            [storeId, o.shopify_id]
        );

        return `Order ${o.name} has been cancelled successfully.${args.reason ? ` Reason: ${args.reason}` : ''}`;
    }

    private async initiateRefund(args: any, workspaceId: string): Promise<string> {
        const storeId = await this.getStoreId(workspaceId);
        if (!storeId) return 'No Shopify store connected.';

        const orderNum = (args.order_number || '').replace('#', '');
        const orderRes = await pool.query(
            `SELECT shopify_id, name, line_items, total_price FROM shopify_orders WHERE store_id = $1 AND (order_number::text = $2 OR name ILIKE $3) LIMIT 1`,
            [storeId, orderNum, `%${orderNum}%`]
        );
        if (orderRes.rows.length === 0) return `Order not found.`;

        const o = orderRes.rows[0];
        const store = await this.getStoreInfo(storeId);
        if (!store) return 'Store config not found.';

        const client = new ShopifyApiClient(store.shop_domain, store.access_token);
        const lineItems = (o.line_items || []).map((li: any) => ({ line_item_id: String(li.id), quantity: li.quantity }));
        const refund = await client.calculateRefund(o.shopify_id, lineItems);

        await client.createRefund(o.shopify_id, refund);

        return `Refund initiated for order ${o.name}. Amount: ₹${o.total_price}.${args.reason ? ` Reason: ${args.reason}` : ''}`;
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    private async getStoreId(workspaceId: string): Promise<string | null> {
        const res = await pool.query(`SELECT id FROM shopify_configs WHERE workspace_id = $1 AND is_active = true LIMIT 1`, [workspaceId]);
        return res.rows[0]?.id || null;
    }

    private async getStoreInfo(storeId: string): Promise<{ shop_domain: string; access_token: string } | null> {
        const res = await pool.query(`SELECT shop_domain, access_token FROM shopify_configs WHERE id = $1`, [storeId]);
        return res.rows[0] || null;
    }
}

export const shopifyToolsService = new ShopifyToolsService();
