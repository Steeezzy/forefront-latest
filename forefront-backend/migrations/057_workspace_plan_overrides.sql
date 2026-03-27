-- Migration 057: Workspace plan overrides
-- Stores synced chat + voice entitlement overrides per workspace.

CREATE TABLE IF NOT EXISTS workspace_plan_overrides (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  base_plan_id VARCHAR(100) NOT NULL DEFAULT 'conversa-free',
  voice_addon_id VARCHAR(100) NOT NULL DEFAULT 'voice-none',
  meter_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  feature_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  billing_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspace_plan_overrides_plan ON workspace_plan_overrides(base_plan_id);
