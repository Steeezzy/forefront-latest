/**
 * Shopify Metafields Service
 *
 * Manages reading/writing configuration to Shopify and local cache.
 * Stores backend_url and chatbot_id for zero-config merchant experience.
 */
import { pool } from '../../config/db.js';
export class ShopifyMetafieldsService {
    /**
     * Save full configuration to Shopify metafields and local cache.
     * Called during OAuth callback or manual sync.
     */
    async saveConfig(storeId, shopDomain, accessToken, config) {
        try {
            // 1. Update shopify_configs for quick access
            await pool.query(`UPDATE shopify_configs 
         SET backend_url = $1, chatbot_id = $2, metafields_synced = true, metafields_last_sync = CURRENT_TIMESTAMP 
         WHERE id = $3`, [config.backendUrl, config.chatbotId, storeId]);
            // 2. Save individual metafields to local cache
            const metafields = [
                { key: 'backend_url', value: config.backendUrl },
                { key: 'chatbot_id', value: config.chatbotId }
            ];
            for (const mf of metafields) {
                await pool.query(`INSERT INTO shopify_metafields (store_id, namespace, key, value, value_type)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (store_id, namespace, key) DO UPDATE SET
             value = $4, updated_at = CURRENT_TIMESTAMP`, [storeId, 'forefront', mf.key, mf.value, 'string']);
                // 3. Sync to Shopify metafields for theme to read (fallback)
                await this.syncMetafieldToShopify(shopDomain, accessToken, {
                    namespace: 'forefront',
                    key: mf.key,
                    value: mf.value,
                    valueType: 'string'
                });
            }
        }
        catch (error) {
            console.error('[ShopifyMetafieldsService] Failed to save config:', error.message);
        }
    }
    /**
     * Get the full configuration for a shop domain.
     */
    async getConfigByShopDomain(shopDomain) {
        try {
            const res = await pool.query(`SELECT backend_url, chatbot_id FROM shopify_configs 
         WHERE (shop_domain = $1 OR shop_domain = $2) AND is_active = true
         LIMIT 1`, [shopDomain, shopDomain.replace('.myshopify.com', '')]);
            const row = res.rows[0];
            return {
                backendUrl: row?.backend_url || null,
                chatbotId: row?.chatbot_id || null
            };
        }
        catch (error) {
            console.error('[ShopifyMetafieldsService] Failed to get config by domain:', error.message);
            return { backendUrl: null, chatbotId: null };
        }
    }
    /**
     * Legacy method for backward compatibility if needed in routes.
     */
    async getBackendUrlByShopDomain(shopDomain) {
        const config = await this.getConfigByShopDomain(shopDomain);
        return config.backendUrl;
    }
    /**
     * Sync a metafield to Shopify's metafield API.
     */
    async syncMetafieldToShopify(shopDomain, accessToken, config) {
        try {
            const response = await fetch(`https://${shopDomain}/admin/api/2024-01/metafields.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken,
                },
                body: JSON.stringify({
                    metafield: {
                        namespace: config.namespace,
                        key: config.key,
                        value: config.value,
                        type: config.valueType === 'json_string' ? 'json_string' : 'single_line_text_field',
                    },
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                console.warn(`[ShopifyMetafieldsService] Failed to sync metafield: ${response.status} ${error}`);
            }
        }
        catch (error) {
            console.error('[ShopifyMetafieldsService] Error syncing metafield:', error.message);
        }
    }
}
export const shopifyMetafieldsService = new ShopifyMetafieldsService();
//# sourceMappingURL=ShopifyMetafieldsService.js.map