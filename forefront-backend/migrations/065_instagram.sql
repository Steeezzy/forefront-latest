-- Migration: 065_instagram.sql
-- Instagram DM integration tables

CREATE TABLE IF NOT EXISTS instagram_configs (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  instagram_account_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  verify_token TEXT NOT NULL,
  instagram_username TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  webhook_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_instagram_config_workspace
  ON instagram_configs(workspace_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_instagram_page_id
  ON instagram_configs(page_id);

CREATE INDEX IF NOT EXISTS idx_instagram_config_workspace
  ON instagram_configs(workspace_id);

CREATE TABLE IF NOT EXISTS instagram_conversations (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  instagram_config_id TEXT REFERENCES instagram_configs(id) ON DELETE SET NULL,
  sender_id TEXT NOT NULL,
  sender_username TEXT,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ig_conv_workspace
  ON instagram_conversations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_ig_conv_sender
  ON instagram_conversations(sender_id);

CREATE TABLE IF NOT EXISTS instagram_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES instagram_conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  content TEXT,
  instagram_message_id TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ig_msg_conv
  ON instagram_messages(conversation_id);
