-- Migration: 017_channel_configs.sql
-- Channel integrations configuration

CREATE TABLE IF NOT EXISTS channel_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL, -- messenger, instagram, whatsapp, email
  is_active BOOLEAN DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}',
  webhook_secret VARCHAR(255),
  webhook_url TEXT,
  connected_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'disconnected', -- connected, disconnected, error, pending
  error_message TEXT,
  display_name VARCHAR(255),
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, channel_type)
);

-- Shopify integration
CREATE TABLE IF NOT EXISTS shopify_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  shop_domain VARCHAR(255) NOT NULL,
  access_token VARCHAR(255) NOT NULL,
  scopes TEXT,
  webhook_secret VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  sync_products BOOLEAN DEFAULT true,
  sync_orders BOOLEAN DEFAULT true,
  sync_customers BOOLEAN DEFAULT true,
  last_product_sync_at TIMESTAMP WITH TIME ZONE,
  last_order_sync_at TIMESTAMP WITH TIME ZONE,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  uninstalled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Slack integration
CREATE TABLE IF NOT EXISTS slack_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  team_name VARCHAR(255),
  team_id VARCHAR(255),
  access_token VARCHAR(255) NOT NULL,
  webhook_url TEXT,
  channel_id VARCHAR(100),
  channel_name VARCHAR(255),
  notify_new_conversations BOOLEAN DEFAULT true,
  notify_new_leads BOOLEAN DEFAULT true,
  notify_offline_messages BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_channel_configs_workspace ON channel_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_channel_configs_type ON channel_configs(channel_type);
