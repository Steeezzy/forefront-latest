-- Migration: 011_tickets.sql
-- Ticketing system

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  ticket_number VARCHAR(50) UNIQUE, -- e.g., TKT-001234
  subject VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open', -- open, pending, solved, closed
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  assigned_to UUID REFERENCES users(id),
  tags TEXT[] DEFAULT '{}',
  source VARCHAR(50) DEFAULT 'chat', -- chat, email, manual, widget, api
  requester_name VARCHAR(255),
  requester_email VARCHAR(255),
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_type VARCHAR(50) NOT NULL, -- agent, customer, system
  author_id UUID REFERENCES users(id),
  author_name VARCHAR(255),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_workspace ON tickets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tickets_conversation ON tickets(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);
