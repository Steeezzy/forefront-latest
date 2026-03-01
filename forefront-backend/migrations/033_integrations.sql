-- Migration: 033_integrations.sql
-- Unified integrations framework for all 27+ integrations

-- ============================================================
-- 1. Master integrations table (tracks all connected integrations per workspace)
-- ============================================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL,
  -- Types: zapier, google_analytics, google_tag_manager,
  --        facebook, email, instagram, whatsapp,
  --        agile_crm, zendesk_sell, pipedrive, zoho, hubspot, salesforce,
  --        bigcommerce, adobe_commerce, prestashop, shopify, woocommerce, wordpress,
  --        klaviyo, mailchimp, activecampaign, omnisend, mailerlite, brevo,
  --        judgeme, zendesk
  status VARCHAR(30) DEFAULT 'disconnected', -- connected, disconnected, error, pending
  is_active BOOLEAN DEFAULT false,
  display_name VARCHAR(255),
  config JSONB NOT NULL DEFAULT '{}',
  credentials JSONB NOT NULL DEFAULT '{}', -- encrypted API keys, tokens, secrets
  metadata JSONB NOT NULL DEFAULT '{}',    -- extra info (account name, avatar, etc.)
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  connected_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, integration_type)
);

CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);

-- ============================================================
-- 2. Integration sync logs (audit trail for all sync operations)
-- ============================================================
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL, -- contacts, leads, subscribers, events, orders
  direction VARCHAR(10) DEFAULT 'outbound', -- inbound, outbound, bidirectional
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_integration ON integration_sync_logs(integration_id);

-- ============================================================
-- 3. Integration webhook events (captures inbound webhook payloads)
-- ============================================================
CREATE TABLE IF NOT EXISTS integration_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
  integration_type VARCHAR(50) NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_integration ON integration_webhook_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_unprocessed ON integration_webhook_events(processed) WHERE processed = false;

-- ============================================================
-- 4. GA4 / GTM tracked widget events (analytics events emitted by widget)
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_widget_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_name VARCHAR(100) NOT NULL,
  -- Event names: conversation_started, conversation_rated, conversation_reply,
  --              prechat_finished, prechat_started, widget_open, widget_close,
  --              widget_mute_notifications, visitor_started_bot, custom_event
  visitor_id VARCHAR(255),
  thread_id VARCHAR(255),
  source VARCHAR(50), -- visitor, agent, chatbot
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_widget_events_workspace ON analytics_widget_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_widget_events_name ON analytics_widget_events(event_name);
CREATE INDEX IF NOT EXISTS idx_widget_events_created ON analytics_widget_events(created_at);

-- ============================================================
-- 5. CRM sync contacts (unified contact records synced to/from CRMs)
-- ============================================================
CREATE TABLE IF NOT EXISTS crm_synced_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  local_contact_id UUID, -- references contacts table
  external_id VARCHAR(255), -- ID in the external CRM
  external_url TEXT,        -- deep-link to the record in the CRM
  email VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(100),
  company VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- active, deleted
  sync_direction VARCHAR(10) DEFAULT 'outbound',
  synced_fields JSONB DEFAULT '{}',
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_integration ON crm_synced_contacts(integration_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_external ON crm_synced_contacts(external_id);

-- ============================================================
-- 6. Email marketing subscribers (synced to mailing list providers)
-- ============================================================
CREATE TABLE IF NOT EXISTS marketing_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  list_id VARCHAR(255),   -- external mailing list identifier
  list_name VARCHAR(255),
  external_id VARCHAR(255), -- subscriber ID in the provider
  status VARCHAR(50) DEFAULT 'subscribed', -- subscribed, unsubscribed, pending
  tags JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketing_subs_integration ON marketing_subscribers(integration_id);
CREATE INDEX IF NOT EXISTS idx_marketing_subs_email ON marketing_subscribers(email);

-- ============================================================
-- 7. Zapier webhook endpoints (per-flow webhook URLs for Zapier triggers)
-- ============================================================
CREATE TABLE IF NOT EXISTS zapier_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  hook_url TEXT NOT NULL,       -- Zapier-provided webhook URL for triggers
  event_type VARCHAR(100) NOT NULL, -- contact_created, message_received, conversation_ended, etc.
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_zapier_hooks_integration ON zapier_webhooks(integration_id);
