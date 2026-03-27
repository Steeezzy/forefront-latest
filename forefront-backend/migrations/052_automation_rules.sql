-- Migration 052: Automation Rules
-- Configuration for event-driven triggers and actions

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id VARCHAR(100) NOT NULL,
  agent_id UUID, -- Optional: null means global workspace rule
  trigger_type VARCHAR(50) NOT NULL, -- sentiment_drops, keyword_detected, duration_exceeded
  condition_config JSONB NOT NULL, -- e.g. { "threshold": 0.3 } or { "keyword": "cancel" }
  action_type VARCHAR(50) NOT NULL, -- escalate_to_human, send_sms, create_ticket, end_call
  action_config JSONB DEFAULT '{}', -- e.g. { "message": "Sorry..." }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_workspace ON automation_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_rules_agent ON automation_rules(agent_id);
CREATE INDEX IF NOT EXISTS idx_rules_trigger ON automation_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_rules_active ON automation_rules(is_active);
