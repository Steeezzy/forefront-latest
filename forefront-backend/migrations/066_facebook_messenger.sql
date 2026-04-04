-- Migration: 066_facebook_messenger.sql
-- Facebook Messenger integration tables

CREATE TABLE IF NOT EXISTS facebook_configs (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  page_access_token TEXT NOT NULL,
  app_secret TEXT,
  verify_token TEXT NOT NULL,
  page_name TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  webhook_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_facebook_config_workspace
  ON facebook_configs(workspace_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_facebook_page_id
  ON facebook_configs(page_id);

CREATE INDEX IF NOT EXISTS idx_facebook_config_workspace
  ON facebook_configs(workspace_id);

CREATE TABLE IF NOT EXISTS facebook_conversations (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  facebook_config_id TEXT REFERENCES facebook_configs(id) ON DELETE SET NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fb_conv_workspace
  ON facebook_conversations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_fb_conv_sender
  ON facebook_conversations(sender_id);

CREATE TABLE IF NOT EXISTS facebook_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES facebook_conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  content TEXT,
  facebook_message_id TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fb_msg_conv
  ON facebook_messages(conversation_id);
