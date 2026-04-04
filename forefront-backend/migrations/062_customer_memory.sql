-- 062_customer_memory.sql
-- Phase 1: Memory Agent Foundation
-- Creates tables for customer profiles, interaction logs, and AI actions

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Customer Profiles: Core memory about each customer
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  language TEXT DEFAULT 'en-IN',
  total_interactions INTEGER DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  lifetime_value NUMERIC DEFAULT 0,
  sentiment_trend JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '{}',
  ai_notes TEXT DEFAULT '',
  risk_score NUMERIC DEFAULT 0,
  next_action TEXT,
  next_action_date TIMESTAMPTZ,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON customer_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON customer_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_next_action ON customer_profiles(next_action_date);
CREATE INDEX IF NOT EXISTS idx_profiles_risk_score ON customer_profiles(risk_score);
CREATE INDEX IF NOT EXISTS idx_profiles_last_interaction ON customer_profiles(last_interaction);

-- Interaction Logs: Every interaction with a customer
CREATE TABLE IF NOT EXISTS interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  summary TEXT,
  sentiment TEXT,
  outcome TEXT,
  revenue NUMERIC DEFAULT 0,
  raw_transcript TEXT,
  ai_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for interactions
CREATE INDEX IF NOT EXISTS idx_interactions_profile ON interaction_logs(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_interactions_workspace ON interaction_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON interaction_logs(created_at);

-- AI Actions Log: Tracks what the AI decides to do
CREATE TABLE IF NOT EXISTS ai_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_detail TEXT,
  status TEXT DEFAULT 'pending',
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- Indexes for AI actions
CREATE INDEX IF NOT EXISTS idx_actions_workspace ON ai_actions_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON ai_actions_log(status);
CREATE INDEX IF NOT EXISTS idx_actions_customer ON ai_actions_log(customer_profile_id);

-- Comments for documentation
COMMENT ON TABLE customer_profiles IS 'Memory Agent: Stores persistent customer profiles with AI-generated insights';
COMMENT ON TABLE interaction_logs IS 'Memory Agent: Logs every customer interaction across all channels';
COMMENT ON TABLE ai_actions_log IS 'Memory Agent: Tracks AI-initiated actions and their outcomes';
