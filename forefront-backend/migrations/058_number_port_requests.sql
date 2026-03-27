CREATE TABLE IF NOT EXISTS number_port_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  current_provider VARCHAR(100),
  account_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'requested',
  notes TEXT,
  requested_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_number_port_requests_workspace
  ON number_port_requests(workspace_id);
