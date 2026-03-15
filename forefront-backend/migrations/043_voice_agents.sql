CREATE TABLE IF NOT EXISTS voice_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  language VARCHAR(50) DEFAULT 'en-IN',
  voice VARCHAR(100) DEFAULT 'meera',
  system_prompt TEXT,
  first_message TEXT,
  status VARCHAR(50) DEFAULT 'inactive',
  call_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
