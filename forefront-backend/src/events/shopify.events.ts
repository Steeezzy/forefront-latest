/**
 * Shopify Event Emitters & Listeners.
 *
 * Provides a global event emitter for Shopify webhooks (orders, checkouts, etc.)
 * so other modules (like workflows or inbox) can react asynchronously.
 */

import { EventEmitter } from 'events';
import { pool } from '../config/db.js';

export const shopifyEventEmitter = new EventEmitter();

// Example listeners defined eagerly on startup

shopifyEventEmitter.on('shopify.order.fulfilled', async ({ order, storeId }) => {
    try {
        const storeRes = await pool.query(`SELECT workspace_id FROM shopify_configs WHERE id = $1`, [storeId]);
        if (storeRes.rows.length === 0) return;

        // In a complete implementation, this would trigger the ChannelRouterService
        // to send an outbound WhatsApp message or email with tracking info.
        console.log(`[Shopify Events] Order fulfilled event received for order #${order.order_number}`);
    } catch (error: any) {
        console.error(`[Shopify Events] Error in order.fulfilled listener:`, error.message);
    }
});

shopifyEventEmitter.on('shopify.checkout.abandoned', async ({ checkout, storeId }) => {
    try {
        console.log(`[Shopify Events] Abandoned checkout event received for ${checkout.email}. Total: ${checkout.total_price}`);
        // A workflow engine would pick this up, wait 1 hour, and send a recovery message.
    } catch (error: any) {
        console.error(`[Shopify Events] Error in checkout.abandoned listener:`, error.message);
    }
});

shopifyEventEmitter.on('shopify.order.created', ({ order }) => {
    console.log(`[Shopify Events] Order created: ${order.name}`);
});
