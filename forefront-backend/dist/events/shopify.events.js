/**
 * Shopify Event Emitters & Listeners.
 *
 * Provides a global event emitter for Shopify webhooks (orders, checkouts, etc.)
 * so other modules (like workflows or inbox) can react asynchronously.
 */
import { EventEmitter } from 'events';
import { pool } from '../config/db.js';
export const shopifyEventEmitter = new EventEmitter();
// ── Order Fulfilled ──────────────────────────────────────────────────────
shopifyEventEmitter.on('shopify.order.fulfilled', async ({ order, storeId }) => {
    try {
        const storeRes = await pool.query(`SELECT workspace_id FROM shopify_configs WHERE id = $1`, [storeId]);
        if (storeRes.rows.length === 0)
            return;
        const workspaceId = storeRes.rows[0].workspace_id;
        // Find visitor contact from the order email
        const contactRes = await pool.query(`SELECT c.id AS conversation_id FROM conversations c
             JOIN contacts ct ON ct.id = c.contact_id
             WHERE ct.email = $1 AND c.workspace_id = $2
             ORDER BY c.updated_at DESC LIMIT 1`, [order.email, workspaceId]);
        // Build tracking info
        const fulfillments = order.fulfillments || [];
        const trackingUrls = fulfillments
            .filter((f) => f.tracking_url)
            .map((f) => f.tracking_url);
        const trackingMsg = trackingUrls.length > 0
            ? `Your order ${order.name} has been shipped! Track it here: ${trackingUrls[0]}`
            : `Your order ${order.name} has been fulfilled and is on its way!`;
        // Store as an internal note on the conversation if one exists
        if (contactRes.rows.length > 0) {
            const conversationId = contactRes.rows[0].conversation_id;
            await pool.query(`INSERT INTO messages (conversation_id, workspace_id, content, sender_type, message_type, created_at)
                 VALUES ($1, $2, $3, 'system', 'note', NOW())`, [conversationId, workspaceId, trackingMsg]);
        }
        // Queue a notification for the workspace
        await pool.query(`INSERT INTO notifications (workspace_id, type, title, content, created_at, read)
             VALUES ($1, 'shopify', $2, $3, NOW(), false)`, [workspaceId, `Order ${order.name} fulfilled`, trackingMsg]);
        console.log(`[Shopify Events] Order fulfilled: ${order.name} — notification created`);
    }
    catch (error) {
        console.error(`[Shopify Events] Error in order.fulfilled listener:`, error.message);
    }
});
// ── Abandoned Checkout ───────────────────────────────────────────────────
shopifyEventEmitter.on('shopify.checkout.abandoned', async ({ checkout, storeId }) => {
    try {
        const storeRes = await pool.query(`SELECT workspace_id FROM shopify_configs WHERE id = $1`, [storeId]);
        if (storeRes.rows.length === 0)
            return;
        const workspaceId = storeRes.rows[0].workspace_id;
        const recoveryUrl = checkout.abandoned_checkout_url || '';
        const currency = checkout.currency || 'USD';
        const total = checkout.total_price || '0.00';
        // Create a follow-up task for the workspace (1-hour delay concept)
        await pool.query(`INSERT INTO notifications (workspace_id, type, title, content, created_at, read)
             VALUES ($1, 'shopify', $2, $3, NOW(), false)`, [
            workspaceId,
            `Abandoned checkout: ${checkout.email}`,
            `Customer ${checkout.email} abandoned a cart worth ${currency} ${total}. Recovery link: ${recoveryUrl}`
        ]);
        // If there's an existing contact, add a note to their conversation
        if (checkout.email) {
            const contactRes = await pool.query(`SELECT c.id FROM conversations c
                 JOIN contacts ct ON ct.id = c.contact_id
                 WHERE ct.email = $1 AND c.workspace_id = $2
                 ORDER BY c.updated_at DESC LIMIT 1`, [checkout.email, workspaceId]);
            if (contactRes.rows.length > 0) {
                await pool.query(`INSERT INTO messages (conversation_id, workspace_id, content, sender_type, message_type, created_at)
                     VALUES ($1, $2, $3, 'system', 'note', NOW())`, [contactRes.rows[0].id, workspaceId,
                    `🛒 Abandoned checkout detected — ${currency} ${total}. Recovery: ${recoveryUrl}`]);
            }
        }
        console.log(`[Shopify Events] Abandoned checkout: ${checkout.email} — ${currency} ${total}`);
    }
    catch (error) {
        console.error(`[Shopify Events] Error in checkout.abandoned listener:`, error.message);
    }
});
// ── Order Created ────────────────────────────────────────────────────────
shopifyEventEmitter.on('shopify.order.created', async ({ order, storeId }) => {
    try {
        if (!storeId)
            return;
        const storeRes = await pool.query(`SELECT workspace_id FROM shopify_configs WHERE id = $1`, [storeId]);
        if (storeRes.rows.length === 0)
            return;
        const workspaceId = storeRes.rows[0].workspace_id;
        await pool.query(`INSERT INTO notifications (workspace_id, type, title, content, created_at, read)
             VALUES ($1, 'shopify', $2, $3, NOW(), false)`, [
            workspaceId,
            `New order: ${order.name}`,
            `${order.email || 'Unknown customer'} placed order ${order.name} for ${order.currency || ''} ${order.total_price}`
        ]);
        console.log(`[Shopify Events] Order created: ${order.name}`);
    }
    catch (error) {
        console.error(`[Shopify Events] Error in order.created listener:`, error.message);
    }
});
// ── App Uninstalled ──────────────────────────────────────────────────────
shopifyEventEmitter.on('shopify.app.uninstalled', async ({ storeId }) => {
    try {
        const storeRes = await pool.query(`SELECT workspace_id, shop_domain FROM shopify_configs WHERE id = $1`, [storeId]);
        if (storeRes.rows.length === 0)
            return;
        const { workspace_id, shop_domain } = storeRes.rows[0];
        await pool.query(`INSERT INTO notifications (workspace_id, type, title, content, created_at, read)
             VALUES ($1, 'shopify', $2, $3, NOW(), false)`, [workspace_id, `Shopify app uninstalled`, `The Shopify app was uninstalled from ${shop_domain}. Reconnect to resume sync.`]);
        console.log(`[Shopify Events] App uninstalled for store ${shop_domain}`);
    }
    catch (error) {
        console.error(`[Shopify Events] Error in app.uninstalled listener:`, error.message);
    }
});
// ── Product Updated ──────────────────────────────────────────────────────
shopifyEventEmitter.on('shopify.product.updated', async ({ product, storeId }) => {
    try {
        const storeRes = await pool.query(`SELECT workspace_id FROM shopify_configs WHERE id = $1`, [storeId]);
        if (storeRes.rows.length === 0)
            return;
        console.log(`[Shopify Events] Product updated: ${product?.title || product?.id} for store ${storeId}`);
    }
    catch (error) {
        console.error(`[Shopify Events] Error in product.updated listener:`, error.message);
    }
});
//# sourceMappingURL=shopify.events.js.map