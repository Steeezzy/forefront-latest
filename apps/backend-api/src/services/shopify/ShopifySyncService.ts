/**
 * ShopifySyncService — Initial and incremental data sync from Shopify.
 *
 * Handles paginated sync of customers, products, orders, and abandoned
 * checkouts into local PostgreSQL tables. Tracks progress via sync jobs.
 */

import { pool } from '../../config/db.js';
import { ShopifyApiClient } from './ShopifyApiClient.js';
import type { SyncResult } from '../../types/ecommerce.types.js';

export class ShopifySyncService {

    /**
     * Run full initial sync after OAuth install. Called in background.
     */
    async initialSync(storeId: string, shopDomain: string, accessToken: string): Promise<SyncResult> {
        const client = new ShopifyApiClient(shopDomain, accessToken);
        const startTime = Date.now();

        // Create sync job
        const jobRes = await pool.query(
            `INSERT INTO shopify_sync_jobs (store_id, type, status) VALUES ($1, 'initial', 'running') RETURNING id`,
            [storeId]
        );
        const jobId = jobRes.rows[0].id;

        let customersCount = 0;
        let productsCount = 0;
        let ordersCount = 0;

        try {
            // 1. Sync Customers
            let pageInfo: string | undefined;
            do {
                const result = await client.getOrders({ limit: 250, page_info: pageInfo }); // Placeholder—use customers
                const customers = await this.fetchCustomersPage(client, pageInfo);
                for (const raw of customers.data) {
                    await this.upsertCustomer(storeId, raw);
                    customersCount++;
                }
                pageInfo = customers.pageInfo;
                await this.updateJobProgress(jobId, customersCount + productsCount + ordersCount);
            } while (pageInfo);

            // 2. Sync Products
            pageInfo = undefined;
            do {
                const { products, pageInfo: nextPage } = await client.getProducts({ limit: 250, page_info: pageInfo });
                for (const raw of products) {
                    await this.upsertProduct(storeId, raw);
                    productsCount++;
                }
                pageInfo = nextPage;
                await this.updateJobProgress(jobId, customersCount + productsCount + ordersCount);
            } while (pageInfo);

            // 3. Sync Orders (last 90 days)
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
            pageInfo = undefined;
            do {
                const { orders, pageInfo: nextPage } = await client.getOrders({ limit: 250, page_info: pageInfo, created_at_min: ninetyDaysAgo, status: 'any' });
                for (const raw of orders) {
                    await this.upsertOrder(storeId, raw);
                    ordersCount++;
                }
                pageInfo = nextPage;
                await this.updateJobProgress(jobId, customersCount + productsCount + ordersCount);
            } while (pageInfo);

            // 4. Sync Abandoned Checkouts
            pageInfo = undefined;
            do {
                const { checkouts, pageInfo: nextPage } = await client.getAbandonedCheckouts({ limit: 250, page_info: pageInfo });
                for (const raw of checkouts) {
                    await this.upsertAbandonedCheckout(storeId, raw);
                }
                pageInfo = nextPage;
            } while (pageInfo);

            // Mark completed
            const durationMs = Date.now() - startTime;
            await pool.query(
                `UPDATE shopify_sync_jobs SET status = 'completed', records_synced = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [customersCount + productsCount + ordersCount, jobId]
            );
            await pool.query(`UPDATE shopify_configs SET last_synced_at = CURRENT_TIMESTAMP WHERE id = $1`, [storeId]);

            return { customers_count: customersCount, orders_count: ordersCount, products_count: productsCount, duration_ms: durationMs };
        } catch (error: any) {
            await pool.query(`UPDATE shopify_sync_jobs SET status = 'failed', error = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`, [error.message, jobId]);
            throw error;
        }
    }

    /**
     * Incremental sync — only updated records since last sync.
     */
    async incrementalSync(storeId: string): Promise<SyncResult> {
        const storeRes = await pool.query(`SELECT shop_domain, access_token, last_synced_at FROM shopify_configs WHERE id = $1`, [storeId]);
        if (storeRes.rows.length === 0) throw new Error('Store not found');

        const { shop_domain, access_token, last_synced_at } = storeRes.rows[0];
        const client = new ShopifyApiClient(shop_domain, access_token);
        const since = last_synced_at ? new Date(last_synced_at).toISOString() : new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
        const startTime = Date.now();

        let ordersCount = 0;
        let pageInfo: string | undefined;

        do {
            const { orders, pageInfo: nextPage } = await client.getOrders({ created_at_min: since, limit: 250, page_info: pageInfo, status: 'any' });
            for (const raw of orders) { await this.upsertOrder(storeId, raw); ordersCount++; }
            pageInfo = nextPage;
        } while (pageInfo);

        await pool.query(`UPDATE shopify_configs SET last_synced_at = CURRENT_TIMESTAMP WHERE id = $1`, [storeId]);

        return { customers_count: 0, orders_count: ordersCount, products_count: 0, duration_ms: Date.now() - startTime };
    }

    // ─── Upsert Helpers ────────────────────────────────────────────────

    async upsertCustomer(storeId: string, raw: any): Promise<string> {
        const result = await pool.query(
            `INSERT INTO shopify_customers (shopify_id, store_id, email, first_name, last_name, phone,
         orders_count, total_spent, tags, note, verified_email, raw, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (store_id, shopify_id) DO UPDATE SET
         email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
         phone = EXCLUDED.phone, orders_count = EXCLUDED.orders_count, total_spent = EXCLUDED.total_spent,
         tags = EXCLUDED.tags, note = EXCLUDED.note, raw = EXCLUDED.raw, updated_at = EXCLUDED.updated_at,
         synced_at = CURRENT_TIMESTAMP
       RETURNING id`,
            [
                String(raw.id), storeId, raw.email, raw.first_name, raw.last_name, raw.phone,
                raw.orders_count || 0, parseFloat(raw.total_spent || '0'),
                raw.tags ? raw.tags.split(',').map((t: string) => t.trim()) : [],
                raw.note, raw.verified_email || false, JSON.stringify(raw),
                raw.created_at, raw.updated_at,
            ]
        );
        return result.rows[0].id;
    }

    async upsertOrder(storeId: string, raw: any): Promise<string> {
        const result = await pool.query(
            `INSERT INTO shopify_orders (shopify_id, store_id, shopify_customer_id, order_number, name,
         email, phone, financial_status, fulfillment_status,
         subtotal_price, total_tax, total_shipping, total_price, currency,
         discount_codes, note, tags, shipping_address, billing_address, line_items,
         cancelled_at, closed_at, processed_at, raw, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
       ON CONFLICT (store_id, shopify_id) DO UPDATE SET
         financial_status = EXCLUDED.financial_status, fulfillment_status = EXCLUDED.fulfillment_status,
         total_price = EXCLUDED.total_price, line_items = EXCLUDED.line_items,
         cancelled_at = EXCLUDED.cancelled_at, closed_at = EXCLUDED.closed_at,
         raw = EXCLUDED.raw, updated_at = EXCLUDED.updated_at, synced_at = CURRENT_TIMESTAMP
       RETURNING id`,
            [
                String(raw.id), storeId, raw.customer?.id ? String(raw.customer.id) : null,
                raw.order_number, raw.name, raw.email, raw.phone,
                raw.financial_status, raw.fulfillment_status,
                parseFloat(raw.subtotal_price || '0'), parseFloat(raw.total_tax || '0'),
                parseFloat(raw.total_shipping_price_set?.shop_money?.amount || '0'),
                parseFloat(raw.total_price || '0'), raw.currency,
                (raw.discount_codes || []).map((d: any) => d.code),
                raw.note, raw.tags ? raw.tags.split(',').map((t: string) => t.trim()) : [],
                JSON.stringify(raw.shipping_address || {}), JSON.stringify(raw.billing_address || {}),
                JSON.stringify(raw.line_items || []),
                raw.cancelled_at, raw.closed_at, raw.processed_at,
                JSON.stringify(raw), raw.created_at, raw.updated_at,
            ]
        );
        return result.rows[0].id;
    }

    async upsertProduct(storeId: string, raw: any): Promise<string> {
        const result = await pool.query(
            `INSERT INTO shopify_products (shopify_id, store_id, title, vendor, product_type, handle,
         status, tags, body_html, variants, images, raw, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (store_id, shopify_id) DO UPDATE SET
         title = EXCLUDED.title, vendor = EXCLUDED.vendor, status = EXCLUDED.status,
         tags = EXCLUDED.tags, variants = EXCLUDED.variants, images = EXCLUDED.images,
         raw = EXCLUDED.raw, updated_at = EXCLUDED.updated_at, synced_at = CURRENT_TIMESTAMP
       RETURNING id`,
            [
                String(raw.id), storeId, raw.title, raw.vendor, raw.product_type, raw.handle,
                raw.status || 'active',
                raw.tags ? raw.tags.split(',').map((t: string) => t.trim()) : [],
                raw.body_html, JSON.stringify(raw.variants || []), JSON.stringify(raw.images || []),
                JSON.stringify(raw), raw.created_at, raw.updated_at,
            ]
        );
        return result.rows[0].id;
    }

    async upsertAbandonedCheckout(storeId: string, raw: any): Promise<string> {
        const result = await pool.query(
            `INSERT INTO shopify_abandoned_checkouts (shopify_id, store_id, email, phone,
         total_price, currency, line_items, abandoned_checkout_url, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (store_id, shopify_id) DO UPDATE SET
         total_price = EXCLUDED.total_price, line_items = EXCLUDED.line_items,
         updated_at = EXCLUDED.updated_at, synced_at = CURRENT_TIMESTAMP
       RETURNING id`,
            [
                String(raw.id), storeId, raw.email, raw.phone,
                parseFloat(raw.total_price || '0'), raw.currency,
                JSON.stringify(raw.line_items || []), raw.abandoned_checkout_url,
                raw.created_at, raw.updated_at,
            ]
        );
        return result.rows[0].id;
    }

    /**
     * Link a Shopify customer to a local Contact by email match.
     */
    async linkCustomerToContact(storeId: string, shopifyCustomerId: string): Promise<void> {
        const custRes = await pool.query(
            `SELECT id, email FROM shopify_customers WHERE store_id = $1 AND shopify_id = $2`, [storeId, shopifyCustomerId]
        );
        if (custRes.rows.length === 0 || !custRes.rows[0].email) return;

        const { id: shopifyCustDbId, email } = custRes.rows[0];

        // Try to find existing contact by email within same workspace
        const wsRes = await pool.query(`SELECT workspace_id FROM shopify_configs WHERE id = $1`, [storeId]);
        if (wsRes.rows.length === 0) return;
        const workspaceId = wsRes.rows[0].workspace_id;

        const contactRes = await pool.query(`SELECT id FROM contacts WHERE workspace_id = $1 AND email = $2`, [workspaceId, email]);

        let contactId: string;
        if (contactRes.rows.length > 0) {
            contactId = contactRes.rows[0].id;
            await pool.query(`UPDATE contacts SET shopify_customer_id = $1, store_id = $2 WHERE id = $3`, [shopifyCustomerId, storeId, contactId]);
        } else {
            const cRes = await pool.query(
                `INSERT INTO contacts (workspace_id, email, shopify_customer_id, store_id) VALUES ($1, $2, $3, $4) RETURNING id`,
                [workspaceId, email, shopifyCustomerId, storeId]
            );
            contactId = cRes.rows[0].id;
        }

        await pool.query(`UPDATE shopify_customers SET contact_id = $1 WHERE id = $2`, [contactId, shopifyCustDbId]);
    }

    // ─── Private Helpers ───────────────────────────────────────────────

    private async fetchCustomersPage(client: ShopifyApiClient, pageInfo?: string): Promise<{ data: any[]; pageInfo?: string }> {
        // Use ShopifyApiClient's searchCustomers for initial load,
        // or getCustomers with page_info for pagination.
        try {
            const result = await (client as any).getWithHeaders(
                `/customers.json?limit=250${pageInfo ? `&page_info=${pageInfo}` : ''}`
            );
            const nextPage = (client as any).parseLinkHeader?.(result.linkHeader);
            return { data: result.data?.customers || [], pageInfo: nextPage };
        } catch {
            return { data: [], pageInfo: undefined };
        }
    }

    private async getShopDomainForClient(_client: ShopifyApiClient): Promise<string> {
        return '';
    }

    private async updateJobProgress(jobId: string, recordsSynced: number): Promise<void> {
        await pool.query(`UPDATE shopify_sync_jobs SET records_synced = $1 WHERE id = $2`, [recordsSynced, jobId]);
    }
}

export const shopifySyncService = new ShopifySyncService();
