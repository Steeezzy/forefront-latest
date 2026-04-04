CREATE TABLE IF NOT EXISTS ivr_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Main Menu',
  greeting_message TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  timeout_seconds INTEGER DEFAULT 5,
  max_retries INTEGER DEFAULT 3,
  timeout_action TEXT DEFAULT 'ai_conversation',
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ivr_workspace_unique
  ON ivr_menus(workspace_id);
