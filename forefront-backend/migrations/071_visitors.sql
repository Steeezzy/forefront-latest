ALTER TABLE visitor_sessions
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS visitor_key TEXT,
  ADD COLUMN IF NOT EXISTS page_url TEXT,
  ADD COLUMN IF NOT EXISTS page_title TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS device TEXT,
  ADD COLUMN IF NOT EXISTS browser TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS page_views INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS chat_started BOOLEAN DEFAULT FALSE;

UPDATE visitor_sessions vs
SET workspace_id = v.workspace_id
FROM visitors v
WHERE vs.workspace_id IS NULL
  AND vs.visitor_id = v.id;

UPDATE visitor_sessions
SET visitor_key = COALESCE(visitor_key, visitor_id::text)
WHERE visitor_key IS NULL;

UPDATE visitor_sessions
SET last_seen_at = COALESCE(last_seen_at, started_at, NOW())
WHERE last_seen_at IS NULL;

UPDATE visitor_sessions
SET page_views = COALESCE(page_views, pages_viewed, 1)
WHERE page_views IS NULL OR page_views = 0;

CREATE INDEX IF NOT EXISTS idx_visitors_workspace
  ON visitor_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_visitors_active
  ON visitor_sessions(workspace_id, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_visitors_visitor
  ON visitor_sessions(workspace_id, visitor_key);
