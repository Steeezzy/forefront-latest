-- Migration: 021_conversa_actions.sql

CREATE TABLE IF NOT EXISTS conversa_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    instructions TEXT,
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    output_variables JSONB DEFAULT '[]'::jsonb,
    ask_confirmation BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversa_actions_agent_id ON conversa_actions(agent_id);

-- Optional: Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_conversa_actions_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_conversa_actions_update ON conversa_actions;
CREATE TRIGGER trg_conversa_actions_update
BEFORE UPDATE ON conversa_actions
FOR EACH ROW
EXECUTE FUNCTION update_conversa_actions_updated_at_column();
