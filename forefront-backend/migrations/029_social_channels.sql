-- Migration: 029_social_channels.sql
-- Phase 3: Social channel integration tables

-- ─── Social Accounts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel VARCHAR(30) NOT NULL,       -- whatsapp, instagram, messenger
  account_id VARCHAR(255) NOT NULL,   -- platform UID (phone number ID, page ID, etc.)
  account_name VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  webhook_secret VARCHAR(255),
  connected BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, channel, account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_workspace ON social_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_channel ON social_accounts(channel, account_id);

-- ─── Social Message Statuses ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_message_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID,
  external_message_id VARCHAR(255) NOT NULL,
  channel VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL,        -- sent, delivered, read, failed
  error_code VARCHAR(50),
  error_message TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_external ON social_message_statuses(external_message_id);
CREATE INDEX IF NOT EXISTS idx_sms_message ON social_message_statuses(message_id);

-- ─── Contacts Table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  whatsapp_id VARCHAR(255),
  instagram_id VARCHAR(255),
  messenger_id VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp ON contacts(whatsapp_id) WHERE whatsapp_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_instagram ON contacts(instagram_id) WHERE instagram_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_messenger ON contacts(messenger_id) WHERE messenger_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;

-- ─── Extend Messages Table ──────────────────────────────────────────
ALTER TABLE messages ADD COLUMN IF NOT EXISTS external_message_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS external_thread_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS social_account_id UUID REFERENCES social_accounts(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id);

CREATE INDEX IF NOT EXISTS idx_messages_external_id ON messages(external_message_id) WHERE external_message_id IS NOT NULL;

-- ─── Extend Conversations Table ─────────────────────────────────────
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS social_account_id UUID REFERENCES social_accounts(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS external_thread_id VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id);

-- Auto-update
CREATE OR REPLACE FUNCTION update_social_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_social_accounts_update ON social_accounts;
CREATE TRIGGER trg_social_accounts_update BEFORE UPDATE ON social_accounts
FOR EACH ROW EXECUTE FUNCTION update_social_accounts_updated_at();

CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contacts_update ON contacts;
CREATE TRIGGER trg_contacts_update BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION update_contacts_updated_at();
