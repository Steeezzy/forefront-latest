-- Migration 085: Billing Subscriptions + Usage Tracking
-- Depends on: workspaces table

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE,
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  plan VARCHAR(20) NOT NULL DEFAULT 'free',  -- free, starter, growth, pro
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, past_due, canceled, trialing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_workspace ON subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sub_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_sub_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_plan ON subscriptions(plan);

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  usage_type VARCHAR(50) NOT NULL,  -- voice_minutes, chat_messages, agents, campaigns, knowledge_sources
  quantity NUMERIC NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward compatibility for legacy usage_logs schema from base schema.sql
ALTER TABLE usage_logs
  ADD COLUMN IF NOT EXISTS usage_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE usage_logs
SET usage_type = COALESCE(NULLIF(usage_type, ''), 'chat_messages')
WHERE usage_type IS NULL OR usage_type = '';

UPDATE usage_logs
SET quantity = COALESCE(quantity, 1)
WHERE quantity IS NULL;

UPDATE usage_logs
SET metadata = COALESCE(metadata, '{}'::jsonb)
WHERE metadata IS NULL;

UPDATE usage_logs
SET created_at = COALESCE(created_at, recorded_at, NOW())
WHERE created_at IS NULL;

ALTER TABLE usage_logs
  ALTER COLUMN usage_type SET DEFAULT 'chat_messages',
  ALTER COLUMN quantity SET DEFAULT 1,
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,
  ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE usage_logs
  ALTER COLUMN usage_type SET NOT NULL,
  ALTER COLUMN quantity SET NOT NULL,
  ALTER COLUMN metadata SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usage_workspace ON usage_logs(workspace_id, usage_type);
CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_type ON usage_logs(usage_type);

-- Aggregate view for quick usage lookups
CREATE OR REPLACE VIEW workspace_usage_summary AS
SELECT
  workspace_id,
  usage_type,
  SUM(quantity) AS total_used,
  COUNT(*) AS event_count,
  MAX(created_at) AS last_used_at
FROM usage_logs
WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
GROUP BY workspace_id, usage_type;
