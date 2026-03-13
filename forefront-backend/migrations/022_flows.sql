-- Migration: 022_flows.sql

CREATE TABLE IF NOT EXISTS flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Untitled Flow',
    description TEXT,
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    variables JSONB DEFAULT '{}'::jsonb,
    trigger_type VARCHAR(100),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist if the table was created by an earlier schema version
ALTER TABLE flows ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE CASCADE;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS nodes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS edges JSONB DEFAULT '[]'::jsonb;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '{}'::jsonb;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(100);
ALTER TABLE flows ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Ensure index creation is idempotent
CREATE INDEX IF NOT EXISTS idx_flows_agent_id ON flows(agent_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_flows_update ON flows;
CREATE TRIGGER trg_flows_update
BEFORE UPDATE ON flows
FOR EACH ROW
EXECUTE FUNCTION update_flows_updated_at();
