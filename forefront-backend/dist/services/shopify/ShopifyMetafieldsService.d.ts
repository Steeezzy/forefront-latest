/**
 * Shopify Metafields Service
 *
 * Manages reading/writing configuration to Shopify and local cache.
 * Stores backend_url and chatbot_id for zero-config merchant experience.
 */
export interface MetafieldConfig {
    namespace: string;
    key: string;
    value: string;
    valueType?: 'string' | 'integer' | 'json_string';
}
export declare class ShopifyMetafieldsService {
    /**
     * Save full configuration to Shopify metafields and local cache.
     * Called during OAuth callback or manual sync.
     */
    saveConfig(storeId: string, shopDomain: string, accessToken: string, config: {
        backendUrl: string;
        chatbotId: string;
    }): Promise<void>;
    /**
     * Get the full configuration for a shop domain.
     */
    getConfigByShopDomain(shopDomain: string): Promise<{
        backendUrl: string | null;
        chatbotId: string | null;
    }>;
    /**
     * Legacy method for backward compatibility if needed in routes.
     */
    getBackendUrlByShopDomain(shopDomain: string): Promise<string | null>;
    /**
     * Sync a metafield to Shopify's metafield API.
     */
    private syncMetafieldToShopify;
}
export declare const shopifyMetafieldsService: ShopifyMetafieldsService;
//# sourceMappingURL=ShopifyMetafieldsService.d.ts.map