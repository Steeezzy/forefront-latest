-- Migration: 007_conversation_enhancement.sql
-- Enhanced conversation model with assignment, status, and visitor info

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES users(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'web'; -- web, messenger, instagram, whatsapp, email
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal'; -- low, normal, high, urgent
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open'; -- open, closed, snoozed, pending
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES users(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS was_escalated BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_resolved BOOLEAN DEFAULT false;

-- Visitor info
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS visitor_name VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS visitor_email VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS visitor_phone VARCHAR(50);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS visitor_id UUID; -- Reference to visitors table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS visitor_metadata JSONB DEFAULT '{}';

-- Message enhancements
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text'; -- text, file, image, system, note
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'; -- file URL, note metadata, etc.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false; -- true = internal note
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_confidence FLOAT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_sources TEXT[];
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_tokens_used INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON conversations(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
