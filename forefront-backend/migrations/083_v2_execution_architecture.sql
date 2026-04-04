ALTER TABLE automation_rules
  ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'workspace',
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS cooldown_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS is_terminal BOOLEAN DEFAULT false;

UPDATE automation_rules
SET scope = CASE
  WHEN campaign_id IS NOT NULL THEN 'campaign'
  WHEN agent_id IS NOT NULL THEN 'agent'
  ELSE 'workspace'
END
WHERE scope IS NULL OR scope = '';

CREATE INDEX IF NOT EXISTS idx_automation_rules_scope
  ON automation_rules(scope);
CREATE INDEX IF NOT EXISTS idx_automation_rules_campaign
  ON automation_rules(campaign_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_priority
  ON automation_rules(priority);
CREATE INDEX IF NOT EXISTS idx_automation_rules_event
  ON automation_rules(event_type);

CREATE TABLE IF NOT EXISTS campaign_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_contact_id UUID NOT NULL REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  lock_token TEXT,
  last_error TEXT,
  twilio_sid TEXT,
  execution_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_jobs_campaign
  ON campaign_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_jobs_contact
  ON campaign_jobs(campaign_contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_jobs_workspace
  ON campaign_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaign_jobs_status
  ON campaign_jobs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_jobs_schedule
  ON campaign_jobs(status, scheduled_for);

CREATE TABLE IF NOT EXISTS execution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  session_id UUID REFERENCES conversation_sessions(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_source TEXT DEFAULT 'system',
  dedupe_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_execution_events_dedupe
  ON execution_events(dedupe_key)
  WHERE dedupe_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_execution_events_workspace
  ON execution_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_execution_events_type
  ON execution_events(event_type);
CREATE INDEX IF NOT EXISTS idx_execution_events_status
  ON execution_events(status, created_at);
