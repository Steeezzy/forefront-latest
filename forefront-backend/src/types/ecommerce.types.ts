/**
 * E-Commerce / Shopify type definitions.
 *
 * Covers stores, customers, orders, products, fulfillments, refunds,
 * abandoned checkouts, webhook payloads, and AI context assembly.
 */

// ─── Financial & Fulfillment Statuses ────────────────────────────────

export type ShopifyFinancialStatus =
    | 'pending' | 'authorized' | 'partially_paid' | 'paid'
    | 'partially_refunded' | 'refunded' | 'voided';

export type ShopifyFulfillmentStatus =
    | 'unfulfilled' | 'partial' | 'fulfilled' | 'restocked' | null;

export type ShopifyWebhookTopic =
    | 'orders/create' | 'orders/updated' | 'orders/cancelled'
    | 'orders/fulfilled' | 'orders/paid'
    | 'customers/create' | 'customers/update'
    | 'checkouts/create' | 'checkouts/update'
    | 'refunds/create' | 'fulfillments/create';

// ─── Store ───────────────────────────────────────────────────────────

export interface ShopifyStore {
    id: string;
    workspace_id: string;
    shop_domain: string;
    access_token: string;
    scopes: string[];
    webhook_secret?: string;
    store_name?: string;
    currency: string;
    timezone?: string;
    plan_name?: string;
    connected: boolean;
    last_synced_at?: Date;
    installed_at: Date;
    updated_at: Date;
}

// ─── Address ─────────────────────────────────────────────────────────

export interface ShopifyAddress {
    id?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
    country_code?: string;
    phone?: string;
    is_default?: boolean;
}

// ─── Customer ────────────────────────────────────────────────────────

export interface ShopifyCustomer {
    id: string;
    shopify_id: string;
    store_id: string;
    contact_id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    orders_count: number;
    total_spent: number;
    tags: string[];
    note?: string;
    verified_email: boolean;
    raw: Record<string, any>;
    created_at?: Date;
    updated_at?: Date;
    synced_at?: Date;
}

// ─── Line Item ───────────────────────────────────────────────────────

export interface ShopifyLineItem {
    id?: string;
    shopify_id?: string;
    product_id?: string;
    variant_id?: string;
    title: string;
    variant_title?: string;
    sku?: string;
    quantity: number;
    price: number;
    total_discount?: number;
    fulfillable_quantity?: number;
    fulfillment_status?: string;
    vendor?: string;
    requires_shipping?: boolean;
    taxable?: boolean;
    grams?: number;
}

// ─── Order ───────────────────────────────────────────────────────────

export interface ShopifyOrder {
    id: string;
    shopify_id: string;
    store_id: string;
    shopify_customer_id?: string;
    order_number?: number;
    name?: string;            // #1001
    email?: string;
    phone?: string;
    financial_status?: ShopifyFinancialStatus;
    fulfillment_status?: ShopifyFulfillmentStatus;
    line_items: ShopifyLineItem[];
    shipping_address?: ShopifyAddress;
    billing_address?: ShopifyAddress;
    subtotal_price?: number;
    total_tax?: number;
    total_shipping?: number;
    total_price?: number;
    currency?: string;
    discount_codes?: string[];
    note?: string;
    tags?: string[];
    cancelled_at?: Date;
    closed_at?: Date;
    processed_at?: Date;
    raw: Record<string, any>;
    created_at?: Date;
    updated_at?: Date;
    synced_at?: Date;
}

// ─── Product ─────────────────────────────────────────────────────────

export interface ShopifyVariant {
    id?: string;
    shopify_id?: string;
    product_id?: string;
    title?: string;
    sku?: string;
    price: number;
    compare_at_price?: number;
    inventory_quantity?: number;
    inventory_policy?: string;
    option1?: string;
    option2?: string;
    option3?: string;
    weight?: number;
    weight_unit?: string;
}

export interface ShopifyProductImage {
    id?: string;
    src: string;
    alt_text?: string;
    position?: number;
}

export interface ShopifyProduct {
    id: string;
    shopify_id: string;
    store_id: string;
    title?: string;
    body_html?: string;
    vendor?: string;
    product_type?: string;
    handle?: string;
    status: 'active' | 'archived' | 'draft';
    tags: string[];
    variants: ShopifyVariant[];
    images: ShopifyProductImage[];
    raw: Record<string, any>;
    created_at?: Date;
    updated_at?: Date;
    synced_at?: Date;
}

// ─── Fulfillment ─────────────────────────────────────────────────────

export interface ShopifyFulfillment {
    id: string;
    shopify_id: string;
    order_id?: string;
    status?: string;
    tracking_company?: string;
    tracking_number?: string;
    tracking_url?: string;
    line_items?: ShopifyLineItem[];
    created_at?: Date;
}

// ─── Refund ──────────────────────────────────────────────────────────

export interface ShopifyRefundLineItem {
    line_item_id: string;
    quantity: number;
    restock_type?: string;
    subtotal?: number;
    total_tax?: number;
}

export interface ShopifyTransaction {
    id?: string;
    amount: number;
    currency: string;
    kind: 'sale' | 'capture' | 'refund' | 'void';
    status: 'success' | 'failure' | 'pending';
    gateway?: string;
}

export interface ShopifyRefund {
    id: string;
    shopify_id: string;
    store_id?: string;
    order_id?: string;
    note?: string;
    refund_line_items: ShopifyRefundLineItem[];
    transactions: ShopifyTransaction[];
    created_at?: Date;
}

// ─── Abandoned Checkout ──────────────────────────────────────────────

export interface ShopifyAbandonedCheckout {
    id: string;
    shopify_id: string;
    store_id: string;
    email?: string;
    phone?: string;
    total_price?: number;
    currency?: string;
    line_items: ShopifyLineItem[];
    abandoned_checkout_url?: string;
    recovered_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

// ─── Webhook Payload ─────────────────────────────────────────────────

export interface ShopifyWebhookPayload<T = unknown> {
    topic: ShopifyWebhookTopic;
    domain: string;
    payload: T;
    received_at: Date;
}

// ─── AI Customer Context ─────────────────────────────────────────────

export interface CustomerEcommerceContext {
    customer: ShopifyCustomer;
    recent_orders: ShopifyOrder[];    // last 5
    open_issues: ShopifyOrder[];      // unfulfilled or pending payment
    total_lifetime_value: number;
    first_order_date?: Date;
    last_order_date?: Date;
    abandoned_checkouts: ShopifyAbandonedCheckout[];
}

// ─── Sync result ─────────────────────────────────────────────────────

export interface SyncResult {
    customers_count: number;
    orders_count: number;
    products_count: number;
    duration_ms: number;
}
