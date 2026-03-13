-- Migration: 041_openai_embeddings.sql
-- Updates knowledge_vectors to support 1536-dimensional OpenAI embeddings

-- 1. Truncate existing vectors (Nomic vectors are incompatible with OpenAI)
TRUNCATE knowledge_vectors;

-- 2. Alter column to 1536 dimensions
ALTER TABLE knowledge_vectors 
  ALTER COLUMN embedding TYPE vector(1536);

-- 3. Reset processing status of sources to 'pending' to trigger re-indexing
UPDATE knowledge_sources SET status = 'pending';
