CREATE TABLE IF NOT EXISTS automation_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id VARCHAR(100) NOT NULL,
  agent_id UUID,
  session_id UUID,
  rule_id UUID,
  action_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_workspace ON automation_action_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_session ON automation_action_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_action_logs(status);
