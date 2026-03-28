-- Migration 059: Voice call logs
-- Stores conversation turns for voice agent calls (STT → AI → TTS)

CREATE TABLE IF NOT EXISTS voice_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    agent_id UUID NOT NULL REFERENCES voice_agents(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    ai_message TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en-IN',
    turn_number INTEGER NOT NULL DEFAULT 1,
    audio_bytes INTEGER, -- size of audio chunks in bytes (for usage tracking)
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookup by session, agent, and workspace
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_session ON voice_call_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_agent ON voice_call_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_workspace ON voice_call_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_created_at ON voice_call_logs(created_at DESC);

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_agent_created ON voice_call_logs(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_workspace_created ON voice_call_logs(workspace_id, created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_voice_call_logs_updated_at 
    BEFORE UPDATE ON voice_call_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
