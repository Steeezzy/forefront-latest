-- Migration 039: Configuration Storage
ALTER TABLE shopify_configs ADD COLUMN IF NOT EXISTS backend_url CHARACTER VARYING;
ALTER TABLE shopify_configs ADD COLUMN IF NOT EXISTS chatbot_id CHARACTER VARYING;
