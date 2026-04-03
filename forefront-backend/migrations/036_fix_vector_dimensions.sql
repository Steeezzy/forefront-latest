-- Migration: 036_fix_vector_dimensions.sql
-- Fixes vector dimension mismatch: fix-kb-schema.ts created vector(1536)
-- but fastembed BGESmallENV15 produces 384-dimensional embeddings.

-- Ensure pgvector extension exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Truncate existing vectors (they would be wrong-dimensional anyway)
TRUNCATE knowledge_vectors;

-- Alter the embedding column to the correct 384 dimensions
ALTER TABLE knowledge_vectors
  ALTER COLUMN embedding TYPE vector(384);
