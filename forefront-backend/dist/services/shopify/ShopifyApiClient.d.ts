/**
 * ShopifyApiClient — Per-store REST Admin API wrapper.
 *
 * Wraps Shopify REST Admin API (2024-01) with rate limit handling,
 * retry logic, and typed response unwrapping.
 *
 * Must be instantiated per store (one client per shopDomain / accessToken pair).
 */
import type { ShopifyWebhookTopic } from '../../types/ecommerce.types.js';
export declare class ShopifyApiClient {
    private baseUrl;
    private token;
    private concurrentRequests;
    private maxConcurrent;
    private queue;
    constructor(shopDomain: string, accessToken: string);
    getOrder(orderId: string): Promise<any>;
    getOrders(params?: {
        customer_id?: string;
        status?: string;
        limit?: number;
        page_info?: string;
        created_at_min?: string;
    }): Promise<{
        orders: any[];
        pageInfo?: string;
    }>;
    cancelOrder(orderId: string, reason?: string, refund?: boolean): Promise<any>;
    updateOrderAddress(orderId: string, address: any): Promise<any>;
    createDraftOrder(lineItems: Array<{
        variant_id: string;
        quantity: number;
    }>, customerId?: string): Promise<{
        id: string;
        invoice_url: string;
    }>;
    getCustomer(customerId: string): Promise<any>;
    searchCustomers(query: string, limit?: number): Promise<any[]>;
    getCustomerOrders(customerId: string, limit?: number): Promise<any[]>;
    getProduct(productId: string): Promise<any>;
    getProducts(params?: {
        limit?: number;
        page_info?: string;
        status?: string;
    }): Promise<{
        products: any[];
        pageInfo?: string;
    }>;
    searchProducts(query: string): Promise<any[]>;
    getFulfillments(orderId: string): Promise<any[]>;
    createFulfillment(orderId: string, locationId: string, lineItems?: Array<{
        id: string;
        quantity: number;
    }>): Promise<any>;
    calculateRefund(orderId: string, lineItems: Array<{
        line_item_id: string;
        quantity: number;
    }>): Promise<any>;
    createRefund(orderId: string, refund: any): Promise<any>;
    registerWebhook(topic: ShopifyWebhookTopic, callbackUrl: string): Promise<{
        id: string;
    }>;
    listWebhooks(): Promise<Array<{
        id: string;
        topic: string;
        address: string;
    }>>;
    deleteWebhook(webhookId: string): Promise<void>;
    getAbandonedCheckouts(params?: {
        limit?: number;
        page_info?: string;
    }): Promise<{
        checkouts: any[];
        pageInfo?: string;
    }>;
    private get;
    private getWithHeaders;
    private post;
    private put;
    private del;
    private request;
    private requestWithHeaders;
    private parseLinkHeader;
    private acquireSlot;
    private releaseSlot;
}
//# sourceMappingURL=ShopifyApiClient.d.ts.map