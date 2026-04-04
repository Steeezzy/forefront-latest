-- Migration: 067_email_channel.sql
-- Email channel integration tables

CREATE TABLE IF NOT EXISTS email_channel_configs (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'smtp',
  inbox_email TEXT NOT NULL,
  display_name TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  imap_username TEXT,
  imap_password TEXT,
  webhook_secret TEXT,
  verify_token TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  webhook_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_email_channel_config_workspace
  ON email_channel_configs(workspace_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_email_channel_inbox_email
  ON email_channel_configs(inbox_email);

CREATE INDEX IF NOT EXISTS idx_email_channel_config_workspace
  ON email_channel_configs(workspace_id);

CREATE TABLE IF NOT EXISTS email_channel_conversations (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email_config_id TEXT REFERENCES email_channel_configs(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  subject TEXT,
  thread_id TEXT,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_channel_conv_workspace
  ON email_channel_conversations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_email_channel_conv_customer
  ON email_channel_conversations(customer_email);

CREATE INDEX IF NOT EXISTS idx_email_channel_conv_thread
  ON email_channel_conversations(thread_id);

CREATE TABLE IF NOT EXISTS email_channel_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES email_channel_conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  html_content TEXT,
  email_message_id TEXT,
  status TEXT DEFAULT 'queued',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_channel_msg_conv
  ON email_channel_messages(conversation_id);