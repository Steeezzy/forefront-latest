-- Migration: 016_widget_config.sql
-- Widget configuration

CREATE TABLE IF NOT EXISTS widget_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Appearance
  primary_color VARCHAR(20) DEFAULT '#3B82F6',
  text_color VARCHAR(20) DEFAULT '#FFFFFF',
  background_color VARCHAR(20) DEFAULT '#FFFFFF',
  position VARCHAR(20) DEFAULT 'bottom-right', -- bottom-right, bottom-left
  offset_x INTEGER DEFAULT 20,
  offset_y INTEGER DEFAULT 20,
  bubble_icon VARCHAR(50) DEFAULT 'chat', -- chat, headset, wave, custom
  custom_icon_url TEXT,
  logo_url TEXT,
  font_family VARCHAR(100) DEFAULT 'Inter, system-ui, sans-serif',
  border_radius VARCHAR(20) DEFAULT '12px',
  
  -- Content
  welcome_message TEXT DEFAULT 'Hi there! 👋 How can we help you today?',
  offline_message TEXT DEFAULT 'We are currently offline. Leave a message and we will get back to you as soon as possible!',
  input_placeholder TEXT DEFAULT 'Type a message...',
  agent_name VARCHAR(100) DEFAULT 'Support Team',
  agent_title VARCHAR(100) DEFAULT 'Customer Support',
  agent_avatar_url TEXT,
  
  -- Behavior
  auto_open_delay INTEGER, -- seconds before auto-opening (null = disabled)
  show_on_mobile BOOLEAN DEFAULT true,
  show_agent_photo BOOLEAN DEFAULT true,
  show_typing_indicator BOOLEAN DEFAULT true,
  show_file_upload BOOLEAN DEFAULT true,
  show_emoji_picker BOOLEAN DEFAULT true,
  show_branding BOOLEAN DEFAULT true,
  collect_email_before_chat BOOLEAN DEFAULT false,
  require_email_for_offline BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  
  -- Pages
  hidden_pages TEXT[] DEFAULT '{}',
  visible_only_pages TEXT[] DEFAULT '{}',
  
  -- Language
  default_language VARCHAR(10) DEFAULT 'en',
  auto_detect_language BOOLEAN DEFAULT true,
  
  -- Greeting rules
  greeting_rules JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Greeting rule example:
-- [{"page_url": "/pricing", "message": "Have questions about our pricing?", "delay": 5}]
