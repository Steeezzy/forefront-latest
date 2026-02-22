-- Migration: 010_prechat_forms.sql
-- Pre-chat form configuration

CREATE TABLE IF NOT EXISTS prechat_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  title VARCHAR(255) DEFAULT 'Welcome! Please fill out this form to start chatting.',
  fields JSONB NOT NULL DEFAULT '[
    {"name": "name", "label": "Name", "type": "text", "required": true, "placeholder": "Your name"},
    {"name": "email", "label": "Email", "type": "email", "required": true, "placeholder": "your@email.com"}
  ]',
  custom_fields JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Field types: text, email, phone, dropdown, textarea, checkbox
