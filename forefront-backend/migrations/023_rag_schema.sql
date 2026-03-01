-- Migration: 023_rag_schema.sql
-- RAG Workflow Builder: Knowledge Bases, Documents, Chunks (pgvector), Memories, Flow Executions

-- Ensure pgvector is available
CREATE EXTENSION IF NOT EXISTS vector;

-- ===== KNOWLEDGE BASES =====
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    embedding_model VARCHAR(100) NOT NULL DEFAULT 'text-embedding-3-small',
    embedding_dimensions INT NOT NULL DEFAULT 1536,
    chunk_strategy VARCHAR(50) NOT NULL DEFAULT 'fixed_size',
    chunk_size INT NOT NULL DEFAULT 512,
    chunk_overlap INT NOT NULL DEFAULT 50,
    doc_count INT NOT NULL DEFAULT 0,
    chunk_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'ready',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_kb_agent_id ON knowledge_bases(agent_id);

-- ===== DOCUMENTS =====
CREATE TABLE IF NOT EXISTS kb_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kb_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'file_upload',
    raw_text TEXT,
    char_count INT DEFAULT 0,
    token_count INT DEFAULT 0,
    chunk_count INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_docs_kb_id ON kb_documents(kb_id);

-- ===== DOCUMENT CHUNKS (pgvector) =====
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kb_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(1536),
    chunk_index INT NOT NULL DEFAULT 0,
    char_start INT,
    char_end INT,
    token_count INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chunks_kb_id ON document_chunks(kb_id);
CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON document_chunks(document_id);
-- IVFFlat index for approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat
    ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ===== CONVERSATION MEMORIES =====
CREATE TABLE IF NOT EXISTS conversation_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255) NOT NULL,
    memory_type VARCHAR(50) NOT NULL DEFAULT 'fact',
    content TEXT NOT NULL,
    embedding vector(1536),
    source_conversation_id UUID,
    confidence FLOAT DEFAULT 1.0,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_memories_agent_visitor ON conversation_memories(agent_id, visitor_id);

-- ===== FLOW EXECUTIONS =====
CREATE TABLE IF NOT EXISTS flow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    conversation_id UUID,
    visitor_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    node_trace JSONB DEFAULT '[]'::jsonb,
    variables_snapshot JSONB DEFAULT '{}'::jsonb,
    error_node_id VARCHAR(100),
    error_message TEXT,
    total_tokens_used INT DEFAULT 0,
    llm_cost_usd DECIMAL(10,6) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_executions_flow_id ON flow_executions(flow_id);

-- Auto-update triggers
CREATE OR REPLACE FUNCTION update_kb_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_kb_update ON knowledge_bases;
CREATE TRIGGER trg_kb_update BEFORE UPDATE ON knowledge_bases
FOR EACH ROW EXECUTE FUNCTION update_kb_updated_at();

DROP TRIGGER IF EXISTS trg_docs_update ON kb_documents;
CREATE TRIGGER trg_docs_update BEFORE UPDATE ON kb_documents
FOR EACH ROW EXECUTE FUNCTION update_kb_updated_at();
