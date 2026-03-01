-- Migration: 027_workflows.sql
-- Workflow automation engine — non-conversational backend automations

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'custom',
    -- auto_assign, auto_solve_conversation, auto_solve_ticket,
    -- auto_reply_ticket, custom
  trigger_event VARCHAR(100) NOT NULL,
    -- new_conversation, conversation_idle, new_ticket, ticket_idle,
    -- agent_reply, ticket_reply, conversation_solved
  conditions JSONB DEFAULT '{}',
    -- e.g. { "channel": "email", "tags_contain": "vip", "priority": "urgent" }
  actions JSONB DEFAULT '[]',
    -- e.g. [{ "type": "change_status", "value": "solved" }, { "type": "add_tag", "value": "auto-closed" }]
  config JSONB DEFAULT '{}',
    -- e.g. { "idle_minutes": 30, "reply_template": "..." }
  is_active BOOLEAN DEFAULT false,
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflows_workspace ON workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflows(trigger_event);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active) WHERE is_active = true;

-- Workflow execution log
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_data JSONB DEFAULT '{}',
  actions_executed JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'completed', -- completed, failed, skipped
  error_message TEXT,
  target_id VARCHAR(255), -- conversation_id or ticket_id that was affected
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_workflows_update ON workflows;
CREATE TRIGGER trg_workflows_update
BEFORE UPDATE ON workflows
FOR EACH ROW
EXECUTE FUNCTION update_workflows_updated_at();
