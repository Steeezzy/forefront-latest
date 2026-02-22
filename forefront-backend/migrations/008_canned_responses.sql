-- Migration: 008_canned_responses.sql
-- Canned responses (macros)

CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  shortcut VARCHAR(100) NOT NULL, -- e.g. "/thanks"
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, shortcut)
);

CREATE INDEX IF NOT EXISTS idx_canned_responses_workspace ON canned_responses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_canned_responses_shortcut ON canned_responses(shortcut);
