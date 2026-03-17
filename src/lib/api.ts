import { getMockResponse } from "./mock-data";
import { buildProxyUrl } from "./backend-url";

// ============================================================
// Generic API fetch wrapper
// ============================================================

export async function apiFetch(
    path: string,
    options: RequestInit = {}
) {
    // Use the Next.js API proxy to forward requests to the backend
    // This ensures the auth token cookie is properly included
    const url = buildProxyUrl(path);
    const method = (options.method || "GET").toUpperCase();

    // Add client-side timeout (30s)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
        response = await fetch(url, {
            ...options,
            signal: controller.signal,
            credentials: "include", // Essential for HttpOnly cookies
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        });
    } catch (err: any) {
        clearTimeout(timeout);
        // Network error or timeout — fall back to mock data
        const mock = getMockResponse(path, method);
        if (mock !== null) {
            console.info(`[apiFetch] Using mock data for ${method} ${path} (network error)`);
            return mock;
        }
        if (err.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw err;
    }
    clearTimeout(timeout);

    if (response.status === 401) {
        // Try mock data before throwing auth error
        const mock = getMockResponse(path, method);
        if (mock !== null) {
            console.info(`[apiFetch] Using mock data for ${method} ${path} (401)`);
            return mock;
        }
        throw new Error('UNAUTHORIZED');
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return null;
    }

    let data: any;
    try {
        data = await response.json();
    } catch {
        // JSON parse failure — fall back to mock
        const mock = getMockResponse(path, method);
        if (mock !== null) {
            console.info(`[apiFetch] Using mock data for ${method} ${path} (invalid JSON)`);
            return mock;
        }
        throw new Error("Invalid response from server");
    }

    if (!response.ok) {
        // Non-OK response — fall back to mock data
        const mock = getMockResponse(path, method);
        if (mock !== null) {
            console.info(`[apiFetch] Using mock data for ${method} ${path} (${response.status})`);
            return mock;
        }
        throw new Error(data.message || data.error || "API Error");
    }

    return data;
}

// ============================================================
// Integration Types
// ============================================================

export type IntegrationType =
    | 'zapier' | 'google_analytics' | 'google_tag_manager'
    | 'facebook' | 'email' | 'instagram' | 'whatsapp'
    | 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'agile_crm' | 'zendesk_sell'
    | 'shopify' | 'woocommerce' | 'bigcommerce' | 'adobe_commerce' | 'prestashop' | 'wordpress'
    | 'mailchimp' | 'klaviyo' | 'activecampaign' | 'omnisend' | 'mailerlite' | 'brevo'
    | 'judgeme' | 'zendesk' | 'slack';

export interface Integration {
    id: string;
    workspace_id: string;
    integration_type: IntegrationType;
    status: 'connected' | 'disconnected' | 'error';
    display_name?: string;
    config: Record<string, any>;
    webhook_url?: string;
    metadata: Record<string, any>;
    last_synced_at?: string;
    error_message?: string;
    created_at: string;
    updated_at: string;
}

export interface SyncLog {
    id: string;
    integration_id: string;
    workspace_id: string;
    sync_type: string;
    direction: 'inbound' | 'outbound';
    status: 'running' | 'completed' | 'failed';
    records_synced: number;
    records_failed: number;
    error_message?: string;
    started_at: string;
    completed_at?: string;
}

export interface CrmContact {
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    tags?: string[];
}

export interface MailingList {
    id: string;
    name: string;
    memberCount?: number;
}

export interface MarketingSubscriber {
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    tags?: string[];
}

// ============================================================
// Integration API Functions
// ============================================================

export const integrationsApi = {
    /** List all integrations for the workspace */
    list: () =>
        apiFetch('/api/integrations') as Promise<{ success: boolean; integrations: Integration[] }>,

    /** Get a single integration */
    get: (type: IntegrationType) =>
        apiFetch(`/api/integrations/${type}`) as Promise<{ success: boolean; integration: Integration | null; connected: boolean }>,

    /** Connect an integration */
    connect: (type: IntegrationType, payload: {
        credentials?: Record<string, any>;
        config?: Record<string, any>;
        displayName?: string;
        webhookUrl?: string;
        metadata?: Record<string, any>;
    }) =>
        apiFetch(`/api/integrations/${type}/connect`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }) as Promise<{ success: boolean; integration: Integration }>,

    /** Disconnect an integration */
    disconnect: (type: IntegrationType) =>
        apiFetch(`/api/integrations/${type}/disconnect`, {
            method: 'DELETE',
        }) as Promise<{ success: boolean }>,

    /** Update integration config */
    updateConfig: (type: IntegrationType, config: Record<string, any>) =>
        apiFetch(`/api/integrations/${type}/config`, {
            method: 'PUT',
            body: JSON.stringify({ config }),
        }) as Promise<{ success: boolean }>,

    /** Test integration connection */
    test: (type: IntegrationType) =>
        apiFetch(`/api/integrations/${type}/test`, {
            method: 'POST',
        }) as Promise<{ success: boolean; result: { success: boolean; error?: string } }>,

    /** Get sync logs for an integration */
    getSyncLogs: (type: IntegrationType) =>
        apiFetch(`/api/integrations/${type}/sync-logs`) as Promise<{ success: boolean; logs: SyncLog[] }>,
};

// ============================================================
// CRM API Functions
// ============================================================

export const crmApi = {
    /** Sync a contact to CRM */
    syncContact: (crmType: string, contact: CrmContact) =>
        apiFetch(`/api/integrations/crm/${crmType}/sync-contact`, {
            method: 'POST',
            body: JSON.stringify(contact),
        }) as Promise<{ success: boolean; result: { success: boolean; externalId?: string; externalUrl?: string; error?: string } }>,
};

// ============================================================
// Marketing API Functions
// ============================================================

export const marketingApi = {
    /** Get available mailing lists */
    getLists: (providerType: string) =>
        apiFetch(`/api/integrations/marketing/${providerType}/lists`) as Promise<{ success: boolean; lists: MailingList[] }>,

    /** Subscribe a contact to a list */
    subscribe: (providerType: string, listId: string, subscriber: MarketingSubscriber) =>
        apiFetch(`/api/integrations/marketing/${providerType}/subscribe`, {
            method: 'POST',
            body: JSON.stringify({ listId, subscriber }),
        }) as Promise<{ success: boolean; result: { success: boolean; externalId?: string; error?: string } }>,
};

// ============================================================
// Zapier API Functions
// ============================================================

export const zapierApi = {
    /** Get registered webhooks */
    getWebhooks: () =>
        apiFetch('/api/integrations/zapier/webhooks') as Promise<{ success: boolean; webhooks: any[] }>,

    /** Register a webhook */
    registerWebhook: (webhookUrl: string, triggerEvent: string, flowId?: string) =>
        apiFetch('/api/integrations/zapier/webhooks', {
            method: 'POST',
            body: JSON.stringify({ webhookUrl, triggerEvent, flowId }),
        }) as Promise<{ success: boolean; webhookId: string }>,

    /** Remove a webhook */
    removeWebhook: (webhookId: string) =>
        apiFetch(`/api/integrations/zapier/webhooks/${webhookId}`, {
            method: 'DELETE',
        }) as Promise<{ success: boolean }>,

    /** Test a webhook URL */
    testWebhook: (webhookUrl: string) =>
        apiFetch('/api/integrations/zapier/test-webhook', {
            method: 'POST',
            body: JSON.stringify({ webhookUrl }),
        }) as Promise<{ success: boolean; result: { success: boolean; error?: string } }>,
};

// ============================================================
// E-commerce API Functions
// ============================================================

export const ecommerceApi = {
    /** Lookup orders */
    lookupOrders: (providerType: string, params: { email?: string; orderId?: string }) => {
        const query = new URLSearchParams();
        if (params.email) query.set('email', params.email);
        if (params.orderId) query.set('orderId', params.orderId);
        return apiFetch(`/api/integrations/ecommerce/${providerType}/orders?${query}`) as Promise<{ success: boolean; orders?: any[]; order?: any }>;
    },

    /** Get WordPress widget snippet */
    getWordPressSnippet: () =>
        apiFetch('/api/integrations/wordpress/snippet') as Promise<{ success: boolean; snippet: string; instructions: string }>,
};

// ============================================================
// Zendesk API Functions
// ============================================================

export const zendeskApi = {
    /** Create a Zendesk ticket */
    createTicket: (ticket: {
        subject: string;
        description: string;
        requesterEmail: string;
        requesterName?: string;
        priority?: 'urgent' | 'high' | 'normal' | 'low';
        tags?: string[];
    }) =>
        apiFetch('/api/integrations/zendesk/tickets', {
            method: 'POST',
            body: JSON.stringify(ticket),
        }) as Promise<{ success: boolean; result: { success: boolean; ticketId?: string; ticketUrl?: string; error?: string } }>,
};

// ============================================================
// Analytics API Functions
// ============================================================

export const analyticsIntegrationApi = {
    /** Track an event */
    trackEvent: (workspaceId: string, eventName: string, params?: Record<string, any>) =>
        apiFetch('/api/integrations/analytics/track', {
            method: 'POST',
            body: JSON.stringify({ workspaceId, eventName, ...params }),
        }) as Promise<{ success: boolean; tracked: boolean }>,

    /** Get analytics widget config */
    getWidgetConfig: (workspaceId: string) =>
        apiFetch(`/api/integrations/analytics/widget-config/${workspaceId}`) as Promise<{ success: boolean; configs: any }>,

    /** Get analytics events dashboard data */
    getEvents: (params?: { startDate?: string; endDate?: string }) => {
        const query = new URLSearchParams();
        if (params?.startDate) query.set('startDate', params.startDate);
        if (params?.endDate) query.set('endDate', params.endDate);
        return apiFetch(`/api/integrations/analytics/events?${query}`) as Promise<{ success: boolean; events: any[]; counts: Record<string, number> }>;
    },
};

// ============================================================
// Slack API Functions
// ============================================================

export const slackApi = {
    /** Get Slack configuration */
    getConfig: () =>
        apiFetch('/api/integrations/slack') as Promise<{ success: boolean; integration: Integration | null; connected: boolean }>,

    /** Connect Slack */
    connect: (credentials: { botToken: string; channelId?: string; webhookUrl?: string }) =>
        apiFetch('/api/integrations/slack/connect', {
            method: 'POST',
            body: JSON.stringify({ credentials }),
        }) as Promise<{ success: boolean; integration: Integration }>,

    /** Send a test notification */
    testNotification: () =>
        apiFetch('/api/integrations/slack/test-notification', {
            method: 'POST',
        }) as Promise<{ success: boolean; result: { success: boolean; error?: string } }>,

    /** Update Slack notification preferences */
    updatePreferences: (config: {
        notifyNewConversation?: boolean;
        notifyNewTicket?: boolean;
        notifyConversationRated?: boolean;
        notifyOfflineMessage?: boolean;
        channelId?: string;
    }) =>
        apiFetch('/api/integrations/slack/config', {
            method: 'PUT',
            body: JSON.stringify({ config }),
        }) as Promise<{ success: boolean }>,
};

// ============================================================
// Channel API Functions
// ============================================================

export const channelsApi = {
    /** Get all channel settings */
    getSettings: () =>
        apiFetch('/api/channels/settings') as Promise<{ success: boolean; settings: any[] }>,

    /** Update channel settings */
    updateSettings: (channel: string, settings: Record<string, any>) =>
        apiFetch(`/api/channels/settings/${channel}`, {
            method: 'PUT',
            body: JSON.stringify(settings),
        }) as Promise<{ success: boolean }>,

    /** Connect email */
    connectEmail: (config: { type: 'gmail' | 'smtp'; credentials: Record<string, any> }) =>
        apiFetch('/api/channels/email/connect', {
            method: 'POST',
            body: JSON.stringify(config),
        }) as Promise<{ success: boolean }>,
};

// ============================================================
// Field Mapping API Functions
// ============================================================

export const fieldMappingsApi = {
    /** Get available Questron source fields */
    getSourceFields: () =>
        apiFetch('/api/integrations/field-mappings/source-fields') as Promise<{
            success: boolean;
            fields: Array<{ key: string; label: string; type: string }>;
        }>,

    /** Get default target fields for an integration type */
    getDefaults: (type: string) =>
        apiFetch(`/api/integrations/field-mappings/${type}/defaults`) as Promise<{
            success: boolean;
            defaults: Array<{ source_field: string; target_field: string; target_field_label?: string }>;
        }>,

    /** Get current field mappings for an integration */
    getMappings: (type: string) =>
        apiFetch(`/api/integrations/${type}/field-mappings`) as Promise<{
            success: boolean;
            mappings: Array<{
                id: string;
                source_field: string;
                target_field: string;
                target_field_label?: string;
                is_required: boolean;
                transform: string;
            }>;
        }>,

    /** Save field mappings for an integration */
    saveMappings: (type: string, mappings: Array<{
        source_field: string;
        target_field: string;
        target_field_label?: string;
        is_required?: boolean;
        transform?: string;
    }>) =>
        apiFetch(`/api/integrations/${type}/field-mappings`, {
            method: 'PUT',
            body: JSON.stringify({ mappings }),
        }) as Promise<{ success: boolean; mappings: any[] }>,

    /** Reset mappings to defaults */
    resetToDefaults: (type: string) =>
        apiFetch(`/api/integrations/${type}/field-mappings/reset`, {
            method: 'POST',
        }) as Promise<{ success: boolean; mappings: any[] }>,
};

// ============================================================
// OAuth API Functions
// ============================================================

export const oauthApi = {
    /** Start OAuth flow — returns authorize URL */
    authorize: (type: string, redirectUri?: string) =>
        apiFetch(`/api/integrations/oauth/${type}/authorize`, {
            method: 'POST',
            body: JSON.stringify({ redirectUri }),
        }) as Promise<{ success: boolean; authorizeUrl: string; state: string }>,
};

// ============================================================
// Shopify API Functions
// ============================================================

export interface ShopifyStore {
    id: string;
    shop_domain: string;
    is_active: boolean;
    scopes: string;
    currency?: string;
    plan_name?: string;
    installed_at: string;
    last_synced_at?: string;
}

export interface ShopifyOrder {
    id: string;
    shopify_id: string;
    name: string;
    email: string;
    total_price: string;
    currency: string;
    financial_status: string;
    fulfillment_status: string | null;
    line_items: any[];
    created_at: string;
}

export interface ShopifyProduct {
    id: string;
    shopify_id: string;
    title: string;
    vendor: string;
    product_type: string;
    status: string;
    handle: string;
    variants: any[];
    images: any[];
    created_at: string;
}

export const shopifyApi = {
    /** Get connected stores */
    getStores: () =>
        apiFetch('/api/shopify/stores') as Promise<{ success: boolean; stores: ShopifyStore[] }>,

    /** Get single store details */
    getStore: (storeId: string) =>
        apiFetch(`/api/shopify/stores/${storeId}`) as Promise<{ success: boolean; store: ShopifyStore }>,

    /** Begin OAuth install */
    install: (shop: string) =>
        apiFetch(`/api/shopify/install?shop=${encodeURIComponent(shop)}`) as Promise<{ success: boolean; authorizeUrl: string }>,

    /** Disconnect a store */
    disconnect: (storeId: string) =>
        apiFetch(`/api/shopify/stores/${storeId}`, { method: 'DELETE' }) as Promise<{ success: boolean }>,

    /** Get orders for a store */
    getOrders: (storeId: string, params?: { status?: string; limit?: number; page?: number }) => {
        const qs = new URLSearchParams();
        qs.set('storeId', storeId);
        if (params?.status) qs.set('status', params.status);
        if (params?.limit) qs.set('limit', String(params.limit));
        if (params?.page) qs.set('page', String(params.page));
        return apiFetch(`/api/shopify/orders?${qs}`) as Promise<{ success: boolean; orders: ShopifyOrder[] }>;
    },

    /** Get single order */
    getOrder: (orderId: string) =>
        apiFetch(`/api/shopify/orders/${orderId}`) as Promise<{ success: boolean; order: ShopifyOrder }>,

    /** Cancel an order */
    cancelOrder: (shopifyOrderId: string, reason?: string) =>
        apiFetch(`/api/shopify/orders/${shopifyOrderId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        }) as Promise<{ success: boolean }>,

    /** Refund an order */
    refundOrder: (shopifyOrderId: string, data: {
        line_items?: Array<{ line_item_id: string; quantity: number }>;
        full_refund?: boolean;
        reason?: string;
        note?: string;
        notify_customer?: boolean;
        restock?: boolean;
    }) =>
        apiFetch(`/api/shopify/orders/${shopifyOrderId}/refund`, {
            method: 'POST',
            body: JSON.stringify(data),
        }) as Promise<{ success: boolean; refund: any }>,

    /** List products */
    getProducts: (storeId: string, params?: { search?: string; limit?: number; offset?: number }) => {
        const qs = new URLSearchParams();
        qs.set('storeId', storeId);
        if (params?.search) qs.set('search', params.search);
        if (params?.limit) qs.set('limit', String(params.limit));
        if (params?.offset) qs.set('offset', String(params.offset));
        return apiFetch(`/api/shopify/products?${qs}`) as Promise<{ success: boolean; products: ShopifyProduct[]; total: number }>;
    },

    /** Search products */
    searchProducts: (storeId: string, query: string) =>
        apiFetch(`/api/shopify/products/search?storeId=${storeId}&q=${encodeURIComponent(query)}`) as Promise<{ success: boolean; products: ShopifyProduct[] }>,

    /** Get cart data for a conversation */
    getCart: (conversationId: string) =>
        apiFetch(`/api/shopify/cart/${conversationId}`) as Promise<{ success: boolean; cart: any }>,

    /** Create coupon / discount code */
    createCoupon: (storeId: string, data: {
        code?: string;
        discount_type: 'percentage' | 'fixed_amount';
        value: number;
        title?: string;
        usage_limit?: number;
    }) =>
        apiFetch('/api/shopify/coupons', {
            method: 'POST',
            body: JSON.stringify({ storeId, ...data }),
        }) as Promise<{ success: boolean; coupon: { code: string; price_rule_id: string } }>,

    /** Search customers */
    searchCustomers: (storeId: string, query: string) =>
        apiFetch(`/api/shopify/customers/search?storeId=${storeId}&q=${encodeURIComponent(query)}`) as Promise<{ success: boolean; customers: any[] }>,

    /** Get customer context */
    getCustomerContext: (customerId: string) =>
        apiFetch(`/api/shopify/customers/${customerId}/context`) as Promise<{ success: boolean; context: any }>,

    /** Get conversation commerce context */
    getConversationContext: (conversationId: string) =>
        apiFetch(`/api/shopify/context/conversation/${conversationId}`) as Promise<{ success: boolean; context: any }>,

    /** Trigger sync for a store */
    triggerSync: (storeId: string) =>
        apiFetch(`/api/shopify/stores/${storeId}/sync`, { method: 'POST' }) as Promise<{ success: boolean; jobId: string }>,
};
