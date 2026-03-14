/**
 * Shopify Metafields Service
 * 
 * Manages reading/writing configuration to Shopify and local cache.
 * Stores chatbot_id for zero-config merchant experience.
 */

import { pool } from '../../config/db.js';

export interface MetafieldConfig {
  namespace: string;
  key: string;
  value: string;
  valueType?: 'string' | 'integer' | 'json_string';
}

export class ShopifyMetafieldsService {
  /**
   * Save full configuration to Shopify metafields and local cache.
   * Called during OAuth callback or manual sync.
   */
  async saveConfig(
    storeId: string,
    shopDomain: string,
    accessToken: string,
    config: { chatbotId: string }
  ): Promise<void> {
    try {
      // 1. Update shopify_configs for quick access
      await pool.query(
        `UPDATE shopify_configs 
         SET chatbot_id = $1, metafields_synced = true, metafields_last_sync = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [config.chatbotId, storeId]
      );

      // 2. Save individual metafields to local cache
      const metafields = [
        { key: 'chatbot_id', value: config.chatbotId }
      ];

      for (const mf of metafields) {
        await pool.query(
          `INSERT INTO shopify_metafields (store_id, namespace, key, value, value_type)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (store_id, namespace, key) DO UPDATE SET
             value = $4, updated_at = CURRENT_TIMESTAMP`,
          [storeId, 'questron', mf.key, mf.value, 'string']
        );

        // 3. Sync to Shopify metafields for theme to read (fallback)
        await this.syncMetafieldToShopify(shopDomain, accessToken, {
          namespace: 'questron',
          key: mf.key,
          value: mf.value,
          valueType: 'string'
        });
      }
    } catch (error: any) {
      console.error('[ShopifyMetafieldsService] Failed to save config:', error.message);
    }
  }

  /**
   * Get the full configuration for a shop domain.
   */
  async getConfigByShopDomain(shopDomain: string): Promise<{ chatbotId: string | null; agentName: string | null }> {
    try {
      const res = await pool.query(
        `SELECT sc.chatbot_id, a.name as agent_name 
         FROM shopify_configs sc
         LEFT JOIN agents a ON a.id::text = sc.chatbot_id
         WHERE (sc.shop_domain = $1 OR sc.shop_domain = $2) AND sc.is_active = true
         LIMIT 1`,
        [shopDomain, shopDomain.replace('.myshopify.com', '')]
      );

      const row = res.rows[0];
      return {
        chatbotId: row?.chatbot_id || null,
        agentName: row?.agent_name || null
      };
    } catch (error: any) {
      console.error('[ShopifyMetafieldsService] Failed to get config by domain:', error.message);
      return { chatbotId: null, agentName: null };
    }
  }


  /**
   * Sync a metafield to Shopify's metafield API.
   */
  private async syncMetafieldToShopify(
    shopDomain: string,
    accessToken: string,
    config: MetafieldConfig
  ): Promise<void> {
    try {
      const response = await fetch(
        `https://${shopDomain}/admin/api/2024-01/metafields.json`,
        {
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
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.warn(`[ShopifyMetafieldsService] Failed to sync metafield: ${response.status} ${error}`);
      }
    } catch (error: any) {
      console.error('[ShopifyMetafieldsService] Error syncing metafield:', error.message);
    }
  }
}

export const shopifyMetafieldsService = new ShopifyMetafieldsService();
