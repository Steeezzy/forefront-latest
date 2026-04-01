-- Migration: 063_chatbot_flows.sql
-- Workspace-based chatbot conversation flows for visual drag-and-drop builder

CREATE TABLE IF NOT EXISTS chatbot_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Untitled Chatbot Flow',
    description TEXT,
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    variables JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for workspace lookups
CREATE INDEX IF NOT EXISTS idx_chatbot_flows_workspace_id ON chatbot_flows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_flows_active ON chatbot_flows(workspace_id, active) WHERE active = true;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chatbot_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_chatbot_flows_update ON chatbot_flows;
CREATE TRIGGER trg_chatbot_flows_update
BEFORE UPDATE ON chatbot_flows
FOR EACH ROW
EXECUTE FUNCTION update_chatbot_flows_updated_at();

-- Flow execution tracking
CREATE TABLE IF NOT EXISTS chatbot_flow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES chatbot_flows(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    visitor_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'running',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    current_node_id VARCHAR(255),
    context JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chatbot_flow_executions_flow_id ON chatbot_flow_executions(flow_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_flow_executions_status ON chatbot_flow_executions(status) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_chatbot_flow_executions_conversation ON chatbot_flow_executions(conversation_id);
