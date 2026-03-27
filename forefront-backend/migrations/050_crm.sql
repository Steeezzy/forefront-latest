-- Migration 050: CRM System
-- Customers, support tickets, and interaction tracking

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(200),
  name VARCHAR(200),
  company VARCHAR(200),
  tags TEXT[] DEFAULT '{}',
  lead_score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  last_contact_at TIMESTAMP,
  total_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id VARCHAR(100) NOT NULL,
  session_id UUID,
  customer_id UUID REFERENCES customers(id),
  subject VARCHAR(300),
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_to UUID,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_ws ON customers(workspace_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_workspace ON customers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_tickets_workspace ON support_tickets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON support_tickets(customer_id);
