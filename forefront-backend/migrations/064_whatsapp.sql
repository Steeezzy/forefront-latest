-- Migration: 064_whatsapp.sql
-- WhatsApp Business integration tables

CREATE TABLE IF NOT EXISTS whatsapp_configs (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  verify_token TEXT NOT NULL,
  business_account_id TEXT,
  display_phone_number TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  webhook_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_config_workspace
  ON whatsapp_configs(workspace_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_phone_number_id
  ON whatsapp_configs(phone_number_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_config_workspace
  ON whatsapp_configs(workspace_id);

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  whatsapp_config_id TEXT REFERENCES whatsapp_configs(id) ON DELETE SET NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  customer_wa_id TEXT,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_conv_workspace
  ON whatsapp_conversations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_wa_conv_phone
  ON whatsapp_conversations(customer_phone);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  whatsapp_message_id TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_msg_conv
  ON whatsapp_messages(conversation_id);
