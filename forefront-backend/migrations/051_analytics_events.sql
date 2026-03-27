-- Migration 051: Analytics Events
-- Structured post-call analytics and metrics

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  workspace_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(50) DEFAULT 'session_complete',
  entities JSONB DEFAULT '{}',
  sentiment VARCHAR(20),
  outcome VARCHAR(50),
  action_items JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_workspace ON analytics_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_outcome ON analytics_events(outcome);
CREATE INDEX IF NOT EXISTS idx_analytics_sentiment ON analytics_events(sentiment);
