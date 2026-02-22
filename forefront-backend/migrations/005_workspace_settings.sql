-- Migration: 005_workspace_settings.sql
-- Workspace configuration enhancements

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'UTC';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS default_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{
  "monday": {"open": "09:00", "close": "17:00", "enabled": true},
  "tuesday": {"open": "09:00", "close": "17:00", "enabled": true},
  "wednesday": {"open": "09:00", "close": "17:00", "enabled": true},
  "thursday": {"open": "09:00", "close": "17:00", "enabled": true},
  "friday": {"open": "09:00", "close": "17:00", "enabled": true},
  "saturday": {"open": "09:00", "close": "17:00", "enabled": false},
  "sunday": {"open": "09:00", "close": "17:00", "enabled": false}
}';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS auto_reply_message TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS offline_message TEXT DEFAULT 'We are currently offline. Leave a message and we will get back to you soon!';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50) DEFAULT 'free';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active'; -- active | trialing | past_due | canceled
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;
