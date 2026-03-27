-- Migration 048: Orchestration Core Tables
-- Conversation sessions and agent routing for multi-agent orchestrator

CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID,
  workspace_id VARCHAR(100) NOT NULL,
  customer_id VARCHAR(100),
  customer_phone VARCHAR(20),
  channel VARCHAR(20) DEFAULT 'voice',
  intent VARCHAR(50),
  outcome VARCHAR(50),
  sentiment_score DECIMAL(3,2),
  transcript JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_routing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  from_agent VARCHAR(50),
  to_agent VARCHAR(50),
  reason VARCHAR(200),
  confidence DECIMAL(3,2),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_workspace ON conversation_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sessions_customer ON conversation_sessions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_sessions_channel ON conversation_sessions(channel);
CREATE INDEX IF NOT EXISTS idx_routing_session ON agent_routing_log(session_id);
