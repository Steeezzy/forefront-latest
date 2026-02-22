-- Migration: 009_visitor_tracking.sql
-- Visitor tracking and page views

CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  visitor_id VARCHAR(255) NOT NULL, -- Client-generated ID
  external_id VARCHAR(255), -- External ID from integrations (e.g., Shopify customer ID)
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_visits INTEGER DEFAULT 1,
  total_conversations INTEGER DEFAULT 0,
  current_page TEXT,
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  os VARCHAR(100),
  os_version VARCHAR(50),
  device_type VARCHAR(50), -- desktop, mobile, tablet
  ip_address INET,
  country VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(100),
  timezone VARCHAR(100),
  language VARCHAR(10),
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_properties JSONB DEFAULT '{}',
  is_online BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, visitor_id)
);

CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  duration_seconds INTEGER,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  pages_viewed INTEGER DEFAULT 0,
  ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_visitors_workspace ON visitors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_visitors_online ON visitors(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor ON visitor_sessions(visitor_id);
