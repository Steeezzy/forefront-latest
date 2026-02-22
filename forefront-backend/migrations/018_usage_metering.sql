-- Migration: 018_usage_metering.sql
-- Enhanced usage metering

CREATE TABLE IF NOT EXISTS usage_meters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  billable_conversations INTEGER DEFAULT 0,
  lyro_conversations INTEGER DEFAULT 0,
  flow_triggers INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  ai_tokens_used INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  file_storage_bytes BIGINT DEFAULT 0,
  UNIQUE(workspace_id, period_start)
);

-- Usage limits warnings
CREATE TABLE IF NOT EXISTS usage_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  resource_type VARCHAR(100) NOT NULL, -- conversations, lyro, flows, storage
  threshold_percent INTEGER NOT NULL, -- 80, 90, 100
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  notification_method VARCHAR(50) DEFAULT 'email' -- email, in_app, sms
);

-- Feature usage tracking
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 1,
  first_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, feature_name)
);

CREATE INDEX IF NOT EXISTS idx_usage_meters_workspace ON usage_meters(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_meters_period ON usage_meters(period_start);
CREATE INDEX IF NOT EXISTS idx_usage_warnings_workspace ON usage_warnings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_workspace ON feature_usage(workspace_id);
