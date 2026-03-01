/**
 * ShopifyApiClient — Per-store REST Admin API wrapper.
 *
 * Wraps Shopify REST Admin API (2024-01) with rate limit handling,
 * retry logic, and typed response unwrapping.
 *
 * Must be instantiated per store (one client per shopDomain / accessToken pair).
 */

import type {
    ShopifyOrder,
    ShopifyCustomer,
    ShopifyProduct,
    ShopifyFulfillment,
    ShopifyRefund,
    ShopifyWebhookTopic,
} from '../../types/ecommerce.types.js';

const API_VERSION = '2024-01';

export class ShopifyApiClient {
    private baseUrl: string;
    private token: string;
    private concurrentRequests = 0;
    private maxConcurrent = 2;
    private queue: Array<() => void> = [];

    constructor(shopDomain: string, accessToken: string) {
        this.baseUrl = `https://${shopDomain}/admin/api/${API_VERSION}`;
        this.token = accessToken;
    }

    // ─── Orders ────────────────────────────────────────────────────────

    async getOrder(orderId: string): Promise<any> {
        const data = await this.get(`/orders/${orderId}.json`);
        return data.order;
    }

    async getOrders(params?: {
        customer_id?: string; status?: string; limit?: number; page_info?: string; created_at_min?: string;
    }): Promise<{ orders: any[]; pageInfo?: string }> {
        const qs = new URLSearchParams();
        if (params?.customer_id) qs.set('customer_id', params.customer_id);
        if (params?.status) qs.set('status', params.status);
        qs.set('limit', String(params?.limit || 50));
        if (params?.created_at_min) qs.set('created_at_min', params.created_at_min);
        if (params?.page_info) qs.set('page_info', params.page_info);

        const { data, linkHeader } = await this.getWithHeaders(`/orders.json?${qs.toString()}`);
        return { orders: data.orders || [], pageInfo: this.parseLinkHeader(linkHeader) };
    }

    async cancelOrder(orderId: string, reason?: string, refund = false): Promise<any> {
        const body: any = {};
        if (reason) body.reason = reason;
        if (refund) body.refund = { note: reason };
        const data = await this.post(`/orders/${orderId}/cancel.json`, body);
        return data.order;
    }

    async createDraftOrder(lineItems: Array<{ variant_id: string; quantity: number }>, customerId?: string): Promise<{ id: string; invoice_url: string }> {
        const body: any = { draft_order: { line_items: lineItems } };
        if (customerId) body.draft_order.customer = { id: customerId };
        const data = await this.post('/draft_orders.json', body);
        return { id: data.draft_order.id, invoice_url: data.draft_order.invoice_url };
    }

    // ─── Customers ─────────────────────────────────────────────────────

    async getCustomer(customerId: string): Promise<any> {
        const data = await this.get(`/customers/${customerId}.json`);
        return data.customer;
    }

    async searchCustomers(query: string, limit = 10): Promise<any[]> {
        const data = await this.get(`/customers/search.json?query=${encodeURIComponent(query)}&limit=${limit}`);
        return data.customers || [];
    }

    async getCustomerOrders(customerId: string, limit = 10): Promise<any[]> {
        const data = await this.get(`/customers/${customerId}/orders.json?limit=${limit}`);
        return data.orders || [];
    }

    // ─── Products ──────────────────────────────────────────────────────

    async getProduct(productId: string): Promise<any> {
        const data = await this.get(`/products/${productId}.json`);
        return data.product;
    }

    async getProducts(params?: { limit?: number; page_info?: string; status?: string }): Promise<{ products: any[]; pageInfo?: string }> {
        const qs = new URLSearchParams();
        qs.set('limit', String(params?.limit || 50));
        if (params?.status) qs.set('status', params.status);
        if (params?.page_info) qs.set('page_info', params.page_info);

        const { data, linkHeader } = await this.getWithHeaders(`/products.json?${qs.toString()}`);
        return { products: data.products || [], pageInfo: this.parseLinkHeader(linkHeader) };
    }

    async searchProducts(query: string): Promise<any[]> {
        // Shopify REST doesn't have native product search. Use title filter.
        const data = await this.get(`/products.json?title=${encodeURIComponent(query)}&limit=10`);
        return data.products || [];
    }

    // ─── Fulfillments ──────────────────────────────────────────────────

    async getFulfillments(orderId: string): Promise<any[]> {
        const data = await this.get(`/orders/${orderId}/fulfillments.json`);
        return data.fulfillments || [];
    }

    async createFulfillment(orderId: string, locationId: string, lineItems?: Array<{ id: string; quantity: number }>): Promise<any> {
        const body: any = { fulfillment: { location_id: locationId } };
        if (lineItems) body.fulfillment.line_items = lineItems;
        const data = await this.post(`/orders/${orderId}/fulfillments.json`, body);
        return data.fulfillment;
    }

    // ─── Refunds ───────────────────────────────────────────────────────

    async calculateRefund(orderId: string, lineItems: Array<{ line_item_id: string; quantity: number }>): Promise<any> {
        const body = { refund: { refund_line_items: lineItems.map((li) => ({ line_item_id: li.line_item_id, quantity: li.quantity, restock_type: 'return' })) } };
        const data = await this.post(`/orders/${orderId}/refunds/calculate.json`, body);
        return data.refund;
    }

    async createRefund(orderId: string, refund: any): Promise<any> {
        const data = await this.post(`/orders/${orderId}/refunds.json`, { refund });
        return data.refund;
    }

    // ─── Webhooks ──────────────────────────────────────────────────────

    async registerWebhook(topic: ShopifyWebhookTopic, callbackUrl: string): Promise<{ id: string }> {
        const data = await this.post('/webhooks.json', {
            webhook: { topic, address: callbackUrl, format: 'json' },
        });
        return { id: data.webhook.id };
    }

    async listWebhooks(): Promise<Array<{ id: string; topic: string; address: string }>> {
        const data = await this.get('/webhooks.json');
        return (data.webhooks || []).map((w: any) => ({ id: w.id, topic: w.topic, address: w.address }));
    }

    async deleteWebhook(webhookId: string): Promise<void> {
        await this.del(`/webhooks/${webhookId}.json`);
    }

    // ─── Abandoned Checkouts ──────────────────────────────────────────

    async getAbandonedCheckouts(params?: { limit?: number; page_info?: string }): Promise<{ checkouts: any[]; pageInfo?: string }> {
        const qs = new URLSearchParams();
        qs.set('limit', String(params?.limit || 50));
        if (params?.page_info) qs.set('page_info', params.page_info);

        const { data, linkHeader } = await this.getWithHeaders(`/checkouts.json?${qs.toString()}`);
        return { checkouts: data.checkouts || [], pageInfo: this.parseLinkHeader(linkHeader) };
    }

    // ─── HTTP Layer ────────────────────────────────────────────────────

    private async get(path: string): Promise<any> {
        return this.request('GET', path);
    }

    private async getWithHeaders(path: string): Promise<{ data: any; linkHeader: string }> {
        return this.requestWithHeaders('GET', path);
    }

    private async post(path: string, body: any): Promise<any> {
        return this.request('POST', path, body);
    }

    private async del(path: string): Promise<void> {
        await this.request('DELETE', path);
    }

    private async request(method: string, path: string, body?: any, retries = 1): Promise<any> {
        await this.acquireSlot();
        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers: {
                    'X-Shopify-Access-Token': this.token,
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            // Rate limited
            if (response.status === 429 && retries > 0) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
                await new Promise((r) => setTimeout(r, retryAfter * 1000));
                return this.request(method, path, body, retries - 1);
            }

            // Server error
            if (response.status >= 500 && retries > 0) {
                await new Promise((r) => setTimeout(r, 1000));
                return this.request(method, path, body, retries - 1);
            }

            if (!response.ok) {
                const errBody: any = await response.json().catch(() => ({}));
                throw new Error(`Shopify API ${method} ${path}: ${response.status} — ${JSON.stringify(errBody.errors || errBody)}`);
            }

            if (method === 'DELETE') return;
            return response.json();
        } finally {
            this.releaseSlot();
        }
    }

    private async requestWithHeaders(method: string, path: string): Promise<{ data: any; linkHeader: string }> {
        await this.acquireSlot();
        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers: { 'X-Shopify-Access-Token': this.token, 'Content-Type': 'application/json' },
            });

            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
                await new Promise((r) => setTimeout(r, retryAfter * 1000));
                return this.requestWithHeaders(method, path);
            }

            if (!response.ok) {
                const errBody: any = await response.json().catch(() => ({}));
                throw new Error(`Shopify API ${method} ${path}: ${response.status} — ${JSON.stringify(errBody.errors || errBody)}`);
            }

            const data = await response.json();
            const linkHeader = response.headers.get('link') || '';
            return { data, linkHeader };
        } finally {
            this.releaseSlot();
        }
    }

    private parseLinkHeader(header: string): string | undefined {
        const match = header.match(/page_info=([^>&]+)>;\s*rel="next"/);
        return match?.[1];
    }

    private acquireSlot(): Promise<void> {
        if (this.concurrentRequests < this.maxConcurrent) {
            this.concurrentRequests++;
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this.queue.push(() => { this.concurrentRequests++; resolve(); });
        });
    }

    private releaseSlot(): void {
        this.concurrentRequests--;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            next?.();
        }
    }
}
