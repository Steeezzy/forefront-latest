-- Migration: 013_smart_actions.sql
-- Smart actions for AI bot

CREATE TABLE IF NOT EXISTS smart_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  action_type VARCHAR(50) NOT NULL, -- api_call, shopify, hubspot, custom, webhook
  trigger_keywords TEXT[] DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}', -- endpoint, headers, mapping, etc.
  is_active BOOLEAN DEFAULT true,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS smart_action_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID NOT NULL REFERENCES smart_actions(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  input_params JSONB DEFAULT '{}',
  output_result JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'success', -- success, error, pending
  error_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_smart_actions_workspace ON smart_actions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_smart_action_executions_action ON smart_action_executions(action_id);
CREATE INDEX IF NOT EXISTS idx_smart_action_executions_conversation ON smart_action_executions(conversation_id);
