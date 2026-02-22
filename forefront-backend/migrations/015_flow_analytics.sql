-- Migration: 015_flow_analytics.sql
-- Flow automation and analytics

-- Flow executions tracking
CREATE TABLE IF NOT EXISTS flow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  visitor_id VARCHAR(255),
  conversation_id UUID REFERENCES conversations(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'running', -- running, completed, abandoned, error
  nodes_visited TEXT[] DEFAULT '{}',
  data_collected JSONB DEFAULT '{}',
  trigger_type VARCHAR(100),
  execution_time_ms INTEGER
);

-- Flow templates
CREATE TABLE IF NOT EXISTS flow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- welcome, leads, sales, support
  definition_json JSONB NOT NULL,
  thumbnail_url TEXT,
  is_system BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Flow A/B testing
CREATE TABLE IF NOT EXISTS flow_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  definition_json JSONB NOT NULL,
  traffic_percentage INTEGER DEFAULT 50, -- 0-100
  is_control BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flow_executions_flow ON flow_executions(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_executions_workspace ON flow_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_flow_executions_status ON flow_executions(status);
