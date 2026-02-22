-- Migration: 012_ai_analytics.sql
-- AI analytics and escalation tracking

CREATE TABLE IF NOT EXISTS ai_escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  message_id UUID REFERENCES messages(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL, -- low_confidence, user_requested, keyword_trigger, error
  ai_confidence FLOAT,
  original_question TEXT,
  escalated_to UUID REFERENCES users(id),
  escalated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_time_seconds INTEGER
);

CREATE TABLE IF NOT EXISTS unanswered_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  normalized_question TEXT, -- For deduplication
  frequency INTEGER DEFAULT 1,
  last_asked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  first_asked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT false,
  resolved_with UUID REFERENCES knowledge_sources(id),
  suggested_answer TEXT,
  ai_confidence FLOAT,
  created_conversation_ids UUID[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ai_escalations_workspace ON ai_escalations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_escalations_conversation ON ai_escalations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_workspace ON unanswered_questions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_resolved ON unanswered_questions(resolved) WHERE resolved = false;
