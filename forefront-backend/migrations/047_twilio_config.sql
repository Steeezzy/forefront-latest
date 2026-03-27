-- Migration 047: Twilio Configuration
-- Stores Twilio credentials per workspace for telephony integration

CREATE TABLE IF NOT EXISTS twilio_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id VARCHAR(100) NOT NULL UNIQUE,
  account_sid VARCHAR(100) NOT NULL,
  auth_token_encrypted VARCHAR(500) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_twilio_config_workspace ON twilio_config(workspace_id);
