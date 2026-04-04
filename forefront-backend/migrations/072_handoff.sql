CREATE TABLE IF NOT EXISTS operators (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'agent',
  status TEXT DEFAULT 'offline',
  max_chats INTEGER DEFAULT 5,
  current_chats INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operators_workspace
  ON operators(workspace_id);

CREATE TABLE IF NOT EXISTS handoff_sessions (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  operator_id TEXT REFERENCES operators(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT,
  customer_contact TEXT,
  status TEXT DEFAULT 'waiting',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_handoff_workspace
  ON handoff_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_handoff_operator
  ON handoff_sessions(operator_id);
CREATE INDEX IF NOT EXISTS idx_handoff_status
  ON handoff_sessions(status);
