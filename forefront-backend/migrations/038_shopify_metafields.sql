-- Migration 038: Shopify Metafields
-- No schema changes required for basic metafield usage via Shopify API,
-- but we can track if metafields were synced in shopify_configs.

ALTER TABLE shopify_configs ADD COLUMN IF NOT EXISTS metafields_synced BOOLEAN DEFAULT false;
ALTER TABLE shopify_configs ADD COLUMN IF NOT EXISTS metafields_last_sync TIMESTAMP;
