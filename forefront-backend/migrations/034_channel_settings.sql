-- Migration 034: Channel Settings + Email Connections + Agent Takeover
-- Adds per-channel auto-reply settings, email channel support, and agent takeover tracking

-- ═══════════════════════════════════════════════════════════════════
-- 1. Channel Settings (per-channel auto-reply configuration)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS channel_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL,
    channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('whatsapp', 'instagram', 'messenger', 'email', 'web')),

    -- Auto-reply settings
    auto_reply BOOLEAN DEFAULT true,
    tone VARCHAR(30) DEFAULT 'friendly' CHECK (tone IN ('friendly', 'professional', 'warm', 'casual', 'formal')),
    reply_delay_seconds INTEGER DEFAULT 3 CHECK (reply_delay_seconds >= 0 AND reply_delay_seconds <= 30),

    -- Business hours
    business_hours_only BOOLEAN DEFAULT false,
    timezone VARCHAR(50) DEFAULT 'UTC',
    business_hours JSONB DEFAULT '{
        "mon": "09:00-18:00",
        "tue": "09:00-18:00",
        "wed": "09:00-18:00",
        "thu": "09:00-18:00",
        "fri": "09:00-18:00",
        "sat": null,
        "sun": null
    }'::jsonb,

    -- Escalation rules
    escalation_rules JSONB DEFAULT '{
        "on_low_confidence": true,
        "on_angry_sentiment": true,
        "on_keyword": ["speak to human", "agent", "help me", "real person", "live agent"],
        "confidence_threshold": 0.75,
        "escalate_to": "inbox_notification"
    }'::jsonb,

    -- Messages
    fallback_message TEXT DEFAULT 'I''ll connect you with our team shortly!',
    out_of_hours_message TEXT DEFAULT 'We''re currently offline. We''ll reply during business hours!',
    welcome_message TEXT DEFAULT NULL,

    -- Channel-specific limits (auto-populated defaults)
    max_reply_length INTEGER DEFAULT 4096,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(workspace_id, channel_type)
);

CREATE INDEX IF NOT EXISTS idx_channel_settings_workspace ON channel_settings(workspace_id);

-- ═══════════════════════════════════════════════════════════════════
-- 2. Email Connections
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS email_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('gmail', 'smtp_imap', 'outlook')),

    -- OAuth tokens (for Gmail/Outlook)
    oauth_access_token TEXT,
    oauth_refresh_token TEXT,
    oauth_token_expires_at TIMESTAMPTZ,

    -- SMTP/IMAP credentials (for custom email)
    imap_host VARCHAR(255),
    imap_port INTEGER DEFAULT 993,
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_username VARCHAR(255),
    smtp_password TEXT,       -- encrypted
    use_ssl BOOLEAN DEFAULT true,

    -- State
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    last_uid BIGINT DEFAULT 0,   -- IMAP UID of last fetched email
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(workspace_id, email_address)
);

CREATE INDEX IF NOT EXISTS idx_email_connections_workspace ON email_connections(workspace_id);

-- ═══════════════════════════════════════════════════════════════════
-- 3. Agent Takeover Tracking
-- ═══════════════════════════════════════════════════════════════════
-- Track which conversations have been taken over by an agent
-- When taken over, auto-reply pauses for that conversation
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS agent_takeover BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS agent_takeover_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS agent_takeover_by UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS auto_reply_paused BOOLEAN DEFAULT false;

-- Track auto-reply metrics per message
ALTER TABLE messages ADD COLUMN IF NOT EXISTS auto_reply_channel VARCHAR(20);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_delay_ms INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tone_applied VARCHAR(30);

-- ═══════════════════════════════════════════════════════════════════
-- 4. Email Threads (tracking for email conversations)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS email_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    email_connection_id UUID REFERENCES email_connections(id) ON DELETE CASCADE,
    thread_id VARCHAR(500),        -- Gmail thread ID or Message-ID chain
    subject VARCHAR(500),
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    last_message_id VARCHAR(500),  -- Message-ID header
    message_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_threads_workspace ON email_threads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_thread_id ON email_threads(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_conversation ON email_threads(conversation_id);

-- ═══════════════════════════════════════════════════════════════════
-- 5. Auto-Reply Log (for analytics and debugging)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS auto_reply_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL,
    conversation_id UUID NOT NULL,
    message_id UUID,
    channel VARCHAR(20) NOT NULL,
    visitor_message TEXT,
    ai_reply TEXT,
    confidence REAL,
    was_escalated BOOLEAN DEFAULT false,
    escalation_reason TEXT,
    tone_applied VARCHAR(30),
    reply_delay_ms INTEGER,
    rag_sources JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_reply_logs_workspace ON auto_reply_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_auto_reply_logs_created ON auto_reply_logs(created_at DESC);
