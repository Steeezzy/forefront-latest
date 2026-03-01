-- Migration: 030_shopify_ecommerce.sql
-- Phase 7: Deep Shopify integration tables.
-- Note: shopify_configs already exists from 017 for basic connection info.
-- These tables store the synced e-commerce data.

-- ─── Shopify Stores (extends shopify_configs) ───────────────────────
-- We use shopify_configs as the source of truth for connection.
-- Add columns that were missing:
ALTER TABLE shopify_configs ADD COLUMN IF NOT EXISTS store_name VARCHAR(255);
ALTER TABLE shopify_configs ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE shopify_configs ADD COLUMN IF NOT EXISTS timezone VARCHAR(100);
ALTER TABLE shopify_configs ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100);
ALTER TABLE shopify_configs ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- ─── Sync Jobs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopify_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES shopify_configs(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,              -- initial, incremental, manual
  status VARCHAR(20) DEFAULT 'running',   -- running, completed, failed
  records_synced INT DEFAULT 0,
  total_records INT,
  error TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_store ON shopify_sync_jobs(store_id);

-- ─── Shopify Customers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopify_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_id VARCHAR(50) NOT NULL,
  store_id UUID NOT NULL REFERENCES shopify_configs(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  orders_count INT DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  note TEXT,
  verified_email BOOLEAN DEFAULT false,
  raw JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_id, shopify_id)
);

CREATE INDEX IF NOT EXISTS idx_shopify_customers_store ON shopify_customers(store_id);
CREATE INDEX IF NOT EXISTS idx_shopify_customers_email ON shopify_customers(email);
CREATE INDEX IF NOT EXISTS idx_shopify_customers_contact ON shopify_customers(contact_id);

-- ─── Shopify Orders ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_id VARCHAR(50) NOT NULL,
  store_id UUID NOT NULL REFERENCES shopify_configs(id) ON DELETE CASCADE,
  shopify_customer_id VARCHAR(50),
  order_number INT,
  name VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(50),
  financial_status VARCHAR(30),
  fulfillment_status VARCHAR(30),
  subtotal_price DECIMAL(12,2),
  total_tax DECIMAL(12,2),
  total_shipping DECIMAL(12,2),
  total_price DECIMAL(12,2),
  currency VARCHAR(10),
  discount_codes TEXT[] DEFAULT '{}',
  note TEXT,
  tags TEXT[] DEFAULT '{}',
  shipping_address JSONB,
  billing_address JSONB,
  line_items JSONB NOT NULL DEFAULT '[]',
  cancelled_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  raw JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_id, shopify_id)
);

CREATE INDEX IF NOT EXISTS idx_shopify_orders_store ON shopify_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_customer ON shopify_orders(shopify_customer_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_financial ON shopify_orders(financial_status);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_fulfillment ON shopify_orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_created ON shopify_orders(created_at DESC);

-- ─── Shopify Products ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopify_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_id VARCHAR(50) NOT NULL,
  store_id UUID NOT NULL REFERENCES shopify_configs(id) ON DELETE CASCADE,
  title TEXT,
  vendor VARCHAR(255),
  product_type VARCHAR(100),
  handle VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  tags TEXT[] DEFAULT '{}',
  body_html TEXT,
  variants JSONB NOT NULL DEFAULT '[]',
  images JSONB NOT NULL DEFAULT '[]',
  raw JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_id, shopify_id)
);

CREATE INDEX IF NOT EXISTS idx_shopify_products_store ON shopify_products(store_id);
CREATE INDEX IF NOT EXISTS idx_shopify_products_status ON shopify_products(status);

-- ─── Abandoned Checkouts ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopify_abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_id VARCHAR(50) NOT NULL,
  store_id UUID NOT NULL REFERENCES shopify_configs(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(50),
  total_price DECIMAL(12,2),
  currency VARCHAR(10),
  line_items JSONB NOT NULL DEFAULT '[]',
  abandoned_checkout_url TEXT,
  recovered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_id, shopify_id)
);

-- ─── Shopify Refunds ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopify_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_id VARCHAR(50) NOT NULL,
  store_id UUID NOT NULL REFERENCES shopify_configs(id) ON DELETE CASCADE,
  order_id UUID REFERENCES shopify_orders(id),
  note TEXT,
  refund_line_items JSONB DEFAULT '[]',
  transactions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_id, shopify_id)
);

-- ─── Extend Contacts ────────────────────────────────────────────────
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS shopify_customer_id VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES shopify_configs(id);
CREATE INDEX IF NOT EXISTS idx_contacts_shopify ON contacts(shopify_customer_id) WHERE shopify_customer_id IS NOT NULL;
