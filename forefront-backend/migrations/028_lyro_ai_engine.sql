-- Migration: 028_lyro_ai_engine.sql
-- Phase 4: Lyro AI engine tables — sessions, handoffs, guardrails

-- pgvector extension (should already exist from 023_rag_schema.sql)
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Lyro Sessions ──────────────────────────────────────────────────
-- Stores conversation context for the AI chatbot
CREATE TABLE IF NOT EXISTS lyro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  workspace_id UUID NOT NULL,
  contact_id UUID,
  messages JSONB DEFAULT '[]',
  handed_off BOOLEAN DEFAULT false,
  failed_attempts INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  language VARCHAR(10) DEFAULT 'en-IN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lyro_sessions_conversation ON lyro_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_lyro_sessions_workspace ON lyro_sessions(workspace_id);

-- ─── Handoff Events ─────────────────────────────────────────────────
-- Tracks AI-to-human escalation events
CREATE TABLE IF NOT EXISTS handoff_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  trigger VARCHAR(50) NOT NULL,
    -- low_confidence, customer_request, repeated_failure,
    -- sentiment_negative, guardrail_block, topic_unsupported, agent_escalation_rule
  trigger_detail TEXT,
  ai_summary TEXT,
  suggested_response TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_agent_id UUID,
  assigned_team_id UUID,
  status VARCHAR(20) DEFAULT 'pending',
    -- pending, accepted, resolved, expired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_handoff_workspace_status ON handoff_events(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_handoff_conversation ON handoff_events(conversation_id);

-- ─── Guardrail Rules ────────────────────────────────────────────────
-- Configurable safety rules for AI responses
CREATE TABLE IF NOT EXISTS guardrail_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
    -- topic_block, keyword_filter, pii_detection, confidence_gate, custom_regex
  config JSONB DEFAULT '{}',
    -- topic_block: { topics: ["competitor","pricing"] }
    -- keyword_filter: { keywords: ["damn","hate"], mode: "exact"|"regex" }
    -- pii_detection: { detect: ["email","phone","credit_card","ssn"] }
    -- confidence_gate: { threshold: 0.45 }
    -- custom_regex: { pattern: "..." }
  action VARCHAR(20) DEFAULT 'block',
    -- allow, block, rephrase, handoff
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guardrail_workspace ON guardrail_rules(workspace_id, enabled, priority);

-- ─── Email Queue ─────────────────────────────────────────────────────
-- Outbound email queue for AI-triggered emails
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
    -- pending, sent, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_lyro_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lyro_sessions_update ON lyro_sessions;
CREATE TRIGGER trg_lyro_sessions_update BEFORE UPDATE ON lyro_sessions
FOR EACH ROW EXECUTE FUNCTION update_lyro_sessions_updated_at();

CREATE OR REPLACE FUNCTION update_guardrail_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guardrail_rules_update ON guardrail_rules;
CREATE TRIGGER trg_guardrail_rules_update BEFORE UPDATE ON guardrail_rules
FOR EACH ROW EXECUTE FUNCTION update_guardrail_rules_updated_at();
