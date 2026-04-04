-- Migration 086: CRM Enhancements — Pipeline, Deals, Activities
-- Depends on: customers table

-- Add CRM columns to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deal_stage VARCHAR(30) DEFAULT 'new';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deal_value NUMERIC DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifetime_value NUMERIC DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS source VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_customers_deal_stage ON customers(workspace_id, deal_stage);
CREATE INDEX IF NOT EXISTS idx_customers_lead_score ON customers(workspace_id, lead_score DESC);

-- Customer activities timeline
CREATE TABLE IF NOT EXISTS customer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,  -- call, chat, email, note, deal_update, tag_added, stage_change
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ca_customer ON customer_activities(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ca_workspace ON customer_activities(workspace_id);

-- Deals pipeline
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  value NUMERIC DEFAULT 0,
  stage VARCHAR(30) NOT NULL DEFAULT 'lead',  -- lead, qualified, proposal, negotiation, won, lost
  probability INTEGER DEFAULT 10,  -- 0-100
  expected_close_date DATE,
  assigned_to UUID,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_workspace ON deals(workspace_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_customer ON deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);

-- Pipeline stage definitions (customizable per workspace)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(20) DEFAULT '#6b7280',
  probability INTEGER DEFAULT 10,
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ps_workspace_name ON pipeline_stages(workspace_id, name);
CREATE INDEX IF NOT EXISTS idx_ps_position ON pipeline_stages(workspace_id, position);
