CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  number VARCHAR(20) NOT NULL UNIQUE,
  country_code VARCHAR(5) DEFAULT '+91',
  type VARCHAR(50) DEFAULT 'local',
  status VARCHAR(50) DEFAULT 'active',
  assigned_agent_id UUID REFERENCES voice_agents(id),
  provider VARCHAR(50) DEFAULT 'twilio',
  created_at TIMESTAMP DEFAULT NOW()
);
