/**
 * CustomerContextService — Assembles rich e-commerce context for AI and agents.
 *
 * Fetches customer data, recent orders, open issues, abandoned checkouts,
 * and formats them for Lyro system prompts or inbox sidebar display.
 */
import { pool } from '../../config/db.js';
export class CustomerContextService {
    /**
     * Get full context by email + workspace.
     */
    async getContextByEmail(email, workspaceId) {
        // Find store for this workspace
        const storeRes = await pool.query(`SELECT id FROM shopify_configs WHERE workspace_id = $1 AND is_active = true LIMIT 1`, [workspaceId]);
        if (storeRes.rows.length === 0)
            return null;
        const storeId = storeRes.rows[0].id;
        // Find customer
        const custRes = await pool.query(`SELECT * FROM shopify_customers WHERE store_id = $1 AND email = $2 LIMIT 1`, [storeId, email]);
        if (custRes.rows.length === 0)
            return null;
        const customer = custRes.rows[0];
        // Recent orders (last 5)
        const ordersRes = await pool.query(`SELECT * FROM shopify_orders WHERE store_id = $1 AND shopify_customer_id = $2 ORDER BY created_at DESC LIMIT 5`, [storeId, customer.shopify_id]);
        const recentOrders = ordersRes.rows;
        // Open issues (unfulfilled or pending payment)
        const issuesRes = await pool.query(`SELECT * FROM shopify_orders WHERE store_id = $1 AND shopify_customer_id = $2
       AND (fulfillment_status IN ('unfulfilled','partial') OR financial_status IN ('pending','authorized','partially_paid'))
       ORDER BY created_at DESC`, [storeId, customer.shopify_id]);
        const openIssues = issuesRes.rows;
        // LTV
        const ltvRes = await pool.query(`SELECT COALESCE(SUM(total_price), 0) as ltv FROM shopify_orders
       WHERE store_id = $1 AND shopify_customer_id = $2 AND financial_status = 'paid'`, [storeId, customer.shopify_id]);
        const totalLifetimeValue = parseFloat(ltvRes.rows[0].ltv);
        // First and last order dates
        const firstOrder = recentOrders.length > 0 ? recentOrders[recentOrders.length - 1].created_at : undefined;
        const lastOrder = recentOrders.length > 0 ? recentOrders[0].created_at : undefined;
        // Abandoned checkouts
        const checkoutRes = await pool.query(`SELECT * FROM shopify_abandoned_checkouts WHERE store_id = $1 AND email = $2 AND recovered_at IS NULL ORDER BY created_at DESC LIMIT 3`, [storeId, email]);
        const abandonedCheckouts = checkoutRes.rows;
        return {
            customer,
            recent_orders: recentOrders,
            open_issues: openIssues,
            total_lifetime_value: totalLifetimeValue,
            first_order_date: firstOrder,
            last_order_date: lastOrder,
            abandoned_checkouts: abandonedCheckouts,
        };
    }
    /**
     * Get context by conversation ID (looks up contact email).
     */
    async getContextByConversation(conversationId) {
        const convRes = await pool.query(`SELECT c.workspace_id, co.email
       FROM conversations c
       LEFT JOIN contacts co ON c.contact_id = co.id
       WHERE c.id = $1`, [conversationId]);
        if (convRes.rows.length === 0 || !convRes.rows[0].email)
            return null;
        return this.getContextByEmail(convRes.rows[0].email, convRes.rows[0].workspace_id);
    }
    /**
     * Format context for injection into Lyro's system prompt.
     */
    formatContextForAI(ctx) {
        const name = `${ctx.customer.first_name || ''} ${ctx.customer.last_name || ''}`.trim() || ctx.customer.email || 'Unknown';
        const currency = ctx.recent_orders[0]?.currency || 'INR';
        const lines = [
            `Customer: ${name} | Orders: ${ctx.customer.orders_count} | LTV: ${currency} ${ctx.total_lifetime_value.toFixed(2)}`,
        ];
        if (ctx.last_order_date) {
            lines.push(`Last order: ${new Date(ctx.last_order_date).toLocaleDateString()}`);
        }
        if (ctx.recent_orders.length > 0) {
            const orderStrs = ctx.recent_orders.map((o) => `${o.name} - ${currency} ${o.total_price} - ${o.fulfillment_status || 'unfulfilled'} / ${o.financial_status}`);
            lines.push(`Recent orders: ${orderStrs.join(', ')}`);
        }
        if (ctx.open_issues.length > 0) {
            lines.push(`Open issues: ${ctx.open_issues.length} (${ctx.open_issues.map((o) => o.name).join(', ')})`);
        }
        if (ctx.abandoned_checkouts.length > 0) {
            const total = ctx.abandoned_checkouts.reduce((s, c) => s + (c.total_price || 0), 0);
            lines.push(`Abandoned cart: yes - ${currency} ${total.toFixed(2)}`);
        }
        return lines.join('\n');
    }
    /**
     * Format structured context for the agent inbox sidebar.
     */
    formatContextForAgent(ctx) {
        return {
            customer: {
                name: `${ctx.customer.first_name || ''} ${ctx.customer.last_name || ''}`.trim(),
                email: ctx.customer.email,
                orders_count: ctx.customer.orders_count,
                total_spent: ctx.total_lifetime_value,
                tags: ctx.customer.tags,
            },
            recent_orders: ctx.recent_orders.map((o) => ({
                name: o.name,
                total_price: o.total_price,
                currency: o.currency,
                financial_status: o.financial_status,
                fulfillment_status: o.fulfillment_status,
                created_at: o.created_at,
                line_items_count: (o.line_items || []).length,
            })),
            open_issues: ctx.open_issues.map((o) => ({
                name: o.name,
                issue: o.fulfillment_status === 'unfulfilled' ? 'Not shipped' : `Payment ${o.financial_status}`,
            })),
            abandoned_carts: ctx.abandoned_checkouts.map((c) => ({
                total: c.total_price,
                items_count: (c.line_items || []).length,
                url: c.abandoned_checkout_url,
                created_at: c.created_at,
            })),
        };
    }
    /**
     * Search orders by order number, email, or product title.
     */
    async searchOrders(query, storeId, limit = 10) {
        const res = await pool.query(`SELECT * FROM shopify_orders
       WHERE store_id = $1
         AND (name ILIKE $2 OR email ILIKE $2 OR line_items::text ILIKE $2)
       ORDER BY created_at DESC LIMIT $3`, [storeId, `%${query}%`, limit]);
        return res.rows;
    }
}
export const customerContextService = new CustomerContextService();
//# sourceMappingURL=CustomerContextService.js.map