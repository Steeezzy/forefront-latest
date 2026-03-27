ALTER TABLE voice_agents
  ADD COLUMN IF NOT EXISTS secondary_language VARCHAR(50),
  ADD COLUMN IF NOT EXISTS agent_type VARCHAR(50) DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS call_direction VARCHAR(50) DEFAULT 'outbound',
  ADD COLUMN IF NOT EXISTS template_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS template_meta JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS service_config JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS automation_blueprint JSONB DEFAULT '[]'::jsonb;

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS contact_field_mapping JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS service_config JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS launch_config JSONB DEFAULT '{}'::jsonb;

ALTER TABLE campaign_contacts
  ADD COLUMN IF NOT EXISTS email VARCHAR(200),
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
