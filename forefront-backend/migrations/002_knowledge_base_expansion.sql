-- Migration 002: Knowledge Base Expansion
-- Adds website_pages, qna_pairs, processing_jobs tables
-- Expands knowledge_sources with new columns and source types

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 1. Expand knowledge_sources table
-- ============================================================
-- Drop old CHECK constraint if it exists (type column)
ALTER TABLE knowledge_sources DROP CONSTRAINT IF EXISTS knowledge_sources_type_check;

-- Add new columns
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add updated CHECK constraint supporting new types
ALTER TABLE knowledge_sources ADD CONSTRAINT knowledge_sources_type_check
  CHECK (type IN ('pdf', 'text', 'url', 'qa_pair', 'website', 'manual_qna', 'csv_import', 'zendesk'));

-- ============================================================
-- 2. Website Pages table
-- ============================================================
CREATE TABLE IF NOT EXISTS website_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title VARCHAR(500),
  content TEXT,
  html TEXT,
  word_count INT DEFAULT 0,
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(knowledge_source_id, url)
);

CREATE INDEX IF NOT EXISTS idx_website_pages_source ON website_pages(knowledge_source_id);

-- ============================================================
-- 3. QnA Pairs table
-- ============================================================
CREATE TABLE IF NOT EXISTS qna_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(255),
  language VARCHAR(10) DEFAULT 'en-IN',
  confidence_score FLOAT DEFAULT 1.0,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qna_pairs_source ON qna_pairs(knowledge_source_id);
CREATE INDEX IF NOT EXISTS idx_qna_pairs_question_trgm ON qna_pairs USING gin(question gin_trgm_ops);

-- ============================================================
-- 4. Processing Jobs table
-- ============================================================
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL, -- 'scrape', 'embed', 'import'
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  progress INT DEFAULT 0,
  total_items INT DEFAULT 0,
  processed_items INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_source ON processing_jobs(knowledge_source_id);

-- ============================================================
-- 5. Additional indexes for knowledge_sources
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status ON knowledge_sources(status);
