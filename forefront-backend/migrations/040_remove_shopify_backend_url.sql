-- Migration 040: Remove Backend URL Column
-- Since we are moving to a Saul architecture where the backend URL is hardcoded in the widget.
ALTER TABLE shopify_configs DROP COLUMN IF EXISTS backend_url;
