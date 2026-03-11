/**
 * ShopifyWebhookService — Processes inbound Shopify webhook payloads.
 *
 * Routes each webhook topic to the appropriate handler, upserts data
 * into the local DB, and emits events for downstream automation.
 */
import type { ShopifyWebhookTopic } from '../../types/ecommerce.types.js';
export declare class ShopifyWebhookService {
    private syncService;
    constructor();
    /**
     * Main router — dispatches by topic.
     */
    handleWebhook(topic: ShopifyWebhookTopic, shopDomain: string, payload: any): Promise<void>;
    /**
     * Register all webhooks for a store after OAuth install.
     */
    registerAllWebhooks(storeId: string, shopDomain: string, accessToken: string): Promise<void>;
    private handleOrderCreate;
    private handleOrderUpdate;
    private handleOrderCancelled;
    private handleOrderPaid;
    private handleOrderFulfilled;
    private handleCustomerUpsert;
    private handleCheckout;
    private handleRefundCreate;
    private handleFulfillmentCreate;
    private handleAppUninstalled;
    private handleProductUpdate;
}
export declare const shopifyWebhookService: ShopifyWebhookService;
//# sourceMappingURL=ShopifyWebhookService.d.ts.map