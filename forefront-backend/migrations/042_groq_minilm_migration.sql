-- Migration: 042_groq_minilm_migration.sql
-- Updates knowledge_vectors to support 384-dimensional all-MiniLM-L6-v2 embeddings

-- 1. Truncate existing vectors (OpenAI/Nomic vectors are incompatible)
TRUNCATE knowledge_vectors;

-- 2. Alter column to 384 dimensions
ALTER TABLE knowledge_vectors 
  ALTER COLUMN embedding TYPE vector(384);

-- 3. Reset processing status of sources to 'pending' to trigger re-indexing
UPDATE knowledge_sources SET status = 'pending';
