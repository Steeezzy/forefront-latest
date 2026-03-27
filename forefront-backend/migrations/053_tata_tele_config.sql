-- UP Migration (053_tata_tele_config.sql)
CREATE TABLE IF NOT EXISTS tata_tele_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  api_key VARCHAR(255) NOT NULL,
  api_secret VARCHAR(255) NOT NULL,
  account_id VARCHAR(100), -- Tata Account ID / Billing ID
  base_url VARCHAR(255) DEFAULT 'https://api.tatatele.com', -- Placeholder URL
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id)
);
