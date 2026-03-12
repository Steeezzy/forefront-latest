-- Migration: 031_knowledge_vectors.sql
-- Creates the knowledge_vectors table for storing embeddings from website scraping and Q&A

-- Ensure pgvector extension is available
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Knowledge Vectors table (for website content & Q&A embeddings)
-- Uses 768 dimensions for Nomic Embed Text model
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    content_chunk TEXT NOT NULL,
    embedding vector(768),
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add page_id column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_vectors' AND column_name = 'page_id') THEN
        ALTER TABLE knowledge_vectors ADD COLUMN page_id UUID REFERENCES website_pages(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_knowledge_vectors_source ON knowledge_vectors(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_vectors_page ON knowledge_vectors(page_id);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_knowledge_vectors_embedding
    ON knowledge_vectors USING hnsw (embedding vector_cosine_ops);
