/**
 * E-commerce Integration Providers
 *
 * Supports: WooCommerce, BigCommerce, Adobe Commerce (Magento), PrestaShop, WordPress
 *
 * Note: Shopify is already fully built in src/modules/shopify/
 *
 * These integrations primarily:
 * 1. Embed the Forefront chat widget on the store
 * 2. Sync customer data from orders → contacts
 * 3. Look up order status for customer service queries
 */
export interface EcommerceOrder {
    orderId: string;
    email: string;
    customerName?: string;
    total: number;
    currency: string;
    status: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    createdAt: string;
}
export interface EcommerceCustomer {
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    ordersCount?: number;
    totalSpent?: number;
}
export declare class WooCommerceProvider {
    private storeUrl;
    private consumerKey;
    private consumerSecret;
    constructor(storeUrl: string, consumerKey: string, consumerSecret: string);
    private get authHeader();
    getOrder(orderId: string): Promise<EcommerceOrder | null>;
    findOrdersByEmail(email: string): Promise<EcommerceOrder[]>;
    getCustomer(email: string): Promise<EcommerceCustomer | null>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class BigCommerceProvider {
    private storeHash;
    private accessToken;
    private baseUrl;
    constructor(storeHash: string, accessToken: string);
    getOrder(orderId: string): Promise<EcommerceOrder | null>;
    findOrdersByEmail(email: string): Promise<EcommerceOrder[]>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class AdobeCommerceProvider {
    private baseUrl;
    private accessToken;
    constructor(storeUrl: string, accessToken: string);
    getOrder(orderId: string): Promise<EcommerceOrder | null>;
    findOrdersByEmail(email: string): Promise<EcommerceOrder[]>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class PrestaShopProvider {
    private baseUrl;
    private apiKey;
    constructor(storeUrl: string, apiKey: string);
    private get authHeader();
    getOrder(orderId: string): Promise<EcommerceOrder | null>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class WordPressProvider {
    /**
     * WordPress integration = just embed the chat widget via:
     * 1. WordPress plugin (forefront-chat plugin)
     * 2. Or manual script tag in theme header
     *
     * No API calls needed from backend — purely widget deployment.
     * Configuration is stored in the integrations table as metadata.
     */
    getWidgetSnippet(workspaceId: string, widgetDomain: string): string;
    getPluginInstructions(): string;
}
export declare class EcommerceManager {
    lookupOrder(integrationType: string, credentials: Record<string, any>, orderId: string): Promise<EcommerceOrder | null>;
    findOrders(integrationType: string, credentials: Record<string, any>, email: string): Promise<EcommerceOrder[]>;
    testConnection(integrationType: string, credentials: Record<string, any>): Promise<{
        success: boolean;
        error?: string;
    }>;
    private getProvider;
}
//# sourceMappingURL=ecommerce.provider.d.ts.map