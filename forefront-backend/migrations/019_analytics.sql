-- Migration: 019_analytics.sql
-- Analytics and metrics

CREATE TABLE IF NOT EXISTS conversation_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  channel VARCHAR(50),
  first_response_time_seconds INTEGER,
  resolution_time_seconds INTEGER,
  message_count INTEGER DEFAULT 0,
  ai_message_count INTEGER DEFAULT 0,
  agent_message_count INTEGER DEFAULT 0,
  visitor_message_count INTEGER DEFAULT 0,
  was_escalated BOOLEAN DEFAULT false,
  ai_resolved BOOLEAN DEFAULT false,
  csat_rating INTEGER,
  csat_comment TEXT,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  ai_conversations INTEGER DEFAULT 0,
  human_conversations INTEGER DEFAULT 0,
  avg_first_response_seconds FLOAT,
  avg_resolution_seconds FLOAT,
  avg_csat FLOAT,
  total_messages INTEGER DEFAULT 0,
  ai_resolutions INTEGER DEFAULT 0,
  escalations INTEGER DEFAULT 0,
  leads_captured INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  UNIQUE(workspace_id, date)
);

CREATE TABLE IF NOT EXISTS hourly_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  hour TIMESTAMP WITH TIME ZONE NOT NULL,
  conversations_started INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  avg_response_time_seconds FLOAT,
  UNIQUE(workspace_id, hour)
);

-- CSAT surveys
CREATE TABLE IF NOT EXISTS csat_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES visitors(id),
  rating INTEGER NOT NULL, -- 1-5
  comment TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_conversation_metrics_workspace ON conversation_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_conversation ON conversation_metrics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_daily_aggregates_workspace ON daily_aggregates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_daily_aggregates_date ON daily_aggregates(date);
CREATE INDEX IF NOT EXISTS csat_surveys_conversation ON csat_surveys(conversation_id);
