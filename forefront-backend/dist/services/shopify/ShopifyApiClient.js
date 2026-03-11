/**
 * ShopifyApiClient — Per-store REST Admin API wrapper.
 *
 * Wraps Shopify REST Admin API (2024-01) with rate limit handling,
 * retry logic, and typed response unwrapping.
 *
 * Must be instantiated per store (one client per shopDomain / accessToken pair).
 */
const API_VERSION = '2024-01';
export class ShopifyApiClient {
    baseUrl;
    token;
    concurrentRequests = 0;
    maxConcurrent = 2;
    queue = [];
    constructor(shopDomain, accessToken) {
        this.baseUrl = `https://${shopDomain}/admin/api/${API_VERSION}`;
        this.token = accessToken;
    }
    // ─── Orders ────────────────────────────────────────────────────────
    async getOrder(orderId) {
        const data = await this.get(`/orders/${orderId}.json`);
        return data.order;
    }
    async getOrders(params) {
        const qs = new URLSearchParams();
        if (params?.customer_id)
            qs.set('customer_id', params.customer_id);
        if (params?.status)
            qs.set('status', params.status);
        qs.set('limit', String(params?.limit || 50));
        if (params?.created_at_min)
            qs.set('created_at_min', params.created_at_min);
        if (params?.page_info)
            qs.set('page_info', params.page_info);
        const { data, linkHeader } = await this.getWithHeaders(`/orders.json?${qs.toString()}`);
        return { orders: data.orders || [], pageInfo: this.parseLinkHeader(linkHeader) };
    }
    async cancelOrder(orderId, reason, refund = false) {
        const body = {};
        if (reason)
            body.reason = reason;
        if (refund)
            body.refund = { note: reason };
        const data = await this.post(`/orders/${orderId}/cancel.json`, body);
        return data.order;
    }
    async updateOrderAddress(orderId, address) {
        const body = { order: { id: orderId, shipping_address: address } };
        const data = await this.put(`/orders/${orderId}.json`, body);
        return data.order;
    }
    async createDraftOrder(lineItems, customerId) {
        const body = { draft_order: { line_items: lineItems } };
        if (customerId)
            body.draft_order.customer = { id: customerId };
        const data = await this.post('/draft_orders.json', body);
        return { id: data.draft_order.id, invoice_url: data.draft_order.invoice_url };
    }
    // ─── Customers ─────────────────────────────────────────────────────
    async getCustomer(customerId) {
        const data = await this.get(`/customers/${customerId}.json`);
        return data.customer;
    }
    async searchCustomers(query, limit = 10) {
        const data = await this.get(`/customers/search.json?query=${encodeURIComponent(query)}&limit=${limit}`);
        return data.customers || [];
    }
    async getCustomerOrders(customerId, limit = 10) {
        const data = await this.get(`/customers/${customerId}/orders.json?limit=${limit}`);
        return data.orders || [];
    }
    // ─── Products ──────────────────────────────────────────────────────
    async getProduct(productId) {
        const data = await this.get(`/products/${productId}.json`);
        return data.product;
    }
    async getProducts(params) {
        const qs = new URLSearchParams();
        qs.set('limit', String(params?.limit || 50));
        if (params?.status)
            qs.set('status', params.status);
        if (params?.page_info)
            qs.set('page_info', params.page_info);
        const { data, linkHeader } = await this.getWithHeaders(`/products.json?${qs.toString()}`);
        return { products: data.products || [], pageInfo: this.parseLinkHeader(linkHeader) };
    }
    async searchProducts(query) {
        // Shopify REST doesn't have native product search. Use title filter.
        const data = await this.get(`/products.json?title=${encodeURIComponent(query)}&limit=10`);
        return data.products || [];
    }
    // ─── Fulfillments ──────────────────────────────────────────────────
    async getFulfillments(orderId) {
        const data = await this.get(`/orders/${orderId}/fulfillments.json`);
        return data.fulfillments || [];
    }
    async createFulfillment(orderId, locationId, lineItems) {
        const body = { fulfillment: { location_id: locationId } };
        if (lineItems)
            body.fulfillment.line_items = lineItems;
        const data = await this.post(`/orders/${orderId}/fulfillments.json`, body);
        return data.fulfillment;
    }
    // ─── Refunds ───────────────────────────────────────────────────────
    async calculateRefund(orderId, lineItems) {
        const body = { refund: { refund_line_items: lineItems.map((li) => ({ line_item_id: li.line_item_id, quantity: li.quantity, restock_type: 'return' })) } };
        const data = await this.post(`/orders/${orderId}/refunds/calculate.json`, body);
        return data.refund;
    }
    async createRefund(orderId, refund) {
        const data = await this.post(`/orders/${orderId}/refunds.json`, { refund });
        return data.refund;
    }
    // ─── Webhooks ──────────────────────────────────────────────────────
    async registerWebhook(topic, callbackUrl) {
        const data = await this.post('/webhooks.json', {
            webhook: { topic, address: callbackUrl, format: 'json' },
        });
        return { id: data.webhook.id };
    }
    async listWebhooks() {
        const data = await this.get('/webhooks.json');
        return (data.webhooks || []).map((w) => ({ id: w.id, topic: w.topic, address: w.address }));
    }
    async deleteWebhook(webhookId) {
        await this.del(`/webhooks/${webhookId}.json`);
    }
    // ─── Abandoned Checkouts ──────────────────────────────────────────
    async getAbandonedCheckouts(params) {
        const qs = new URLSearchParams();
        qs.set('limit', String(params?.limit || 50));
        if (params?.page_info)
            qs.set('page_info', params.page_info);
        const { data, linkHeader } = await this.getWithHeaders(`/checkouts.json?${qs.toString()}`);
        return { checkouts: data.checkouts || [], pageInfo: this.parseLinkHeader(linkHeader) };
    }
    // ─── HTTP Layer ────────────────────────────────────────────────────
    async get(path) {
        return this.request('GET', path);
    }
    async getWithHeaders(path) {
        return this.requestWithHeaders('GET', path);
    }
    async post(path, body) {
        return this.request('POST', path, body);
    }
    async put(path, body) {
        return this.request('PUT', path, body);
    }
    async del(path) {
        await this.request('DELETE', path);
    }
    async request(method, path, body, retries = 1) {
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
                const errBody = await response.json().catch(() => ({}));
                throw new Error(`Shopify API ${method} ${path}: ${response.status} — ${JSON.stringify(errBody.errors || errBody)}`);
            }
            if (method === 'DELETE')
                return;
            return response.json();
        }
        finally {
            this.releaseSlot();
        }
    }
    async requestWithHeaders(method, path) {
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
                const errBody = await response.json().catch(() => ({}));
                throw new Error(`Shopify API ${method} ${path}: ${response.status} — ${JSON.stringify(errBody.errors || errBody)}`);
            }
            const data = await response.json();
            const linkHeader = response.headers.get('link') || '';
            return { data, linkHeader };
        }
        finally {
            this.releaseSlot();
        }
    }
    parseLinkHeader(header) {
        const match = header.match(/page_info=([^>&]+)>;\s*rel="next"/);
        return match?.[1];
    }
    acquireSlot() {
        if (this.concurrentRequests < this.maxConcurrent) {
            this.concurrentRequests++;
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this.queue.push(() => { this.concurrentRequests++; resolve(); });
        });
    }
    releaseSlot() {
        this.concurrentRequests--;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            next?.();
        }
    }
}
//# sourceMappingURL=ShopifyApiClient.js.map