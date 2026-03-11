-- Migration: 035_field_mappings.sql
-- Configurable field mappings for CRM and marketing integrations
-- Allows users to map Forefront contact fields → external CRM/marketing fields

CREATE TABLE IF NOT EXISTS integration_field_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL,
  -- e.g. hubspot, salesforce, pipedrive, mailchimp, etc.
  source_field VARCHAR(100) NOT NULL,
  -- Forefront field key: visitor_email, visitor_name, visitor_phone, company, tags, custom_*
  target_field VARCHAR(100) NOT NULL,
  -- External CRM field key: email, firstname, Phone, etc.
  target_field_label VARCHAR(255),
  -- Human-readable label for the target field
  is_required BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  -- true = system-generated default mapping, false = user-created
  transform VARCHAR(50) DEFAULT 'none',
  -- none, lowercase, uppercase, split_first, split_last, join_comma
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, integration_type, source_field)
);

CREATE INDEX IF NOT EXISTS idx_field_mappings_workspace ON integration_field_mappings(workspace_id, integration_type);

-- OAuth state storage for CRM OAuth flows
CREATE TABLE IF NOT EXISTS integration_oauth_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL,
  state_token VARCHAR(255) NOT NULL UNIQUE,
  redirect_url TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_token ON integration_oauth_states(state_token);
