-- Migration: 014_knowledge_enhancement.sql
-- Knowledge source enhancements

ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS sync_frequency VARCHAR(50) DEFAULT 'manual'; -- manual, daily, weekly
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS file_size INTEGER; -- in bytes
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Product catalog for e-commerce
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  external_id VARCHAR(255), -- Shopify product ID, etc.
  name VARCHAR(500) NOT NULL,
  description TEXT,
  short_description TEXT,
  sku VARCHAR(255),
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'INR',
  image_url TEXT,
  product_url TEXT,
  category VARCHAR(255),
  subcategory VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  inventory_quantity INTEGER DEFAULT 0,
  weight DECIMAL(10,2),
  weight_unit VARCHAR(20) DEFAULT 'kg',
  attributes JSONB DEFAULT '{}', -- size, color, etc.
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  source VARCHAR(50) DEFAULT 'manual', -- manual, shopify, csv, api
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_vectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_chunk TEXT NOT NULL,
  embedding vector(384),
  chunk_type VARCHAR(50) DEFAULT 'description', -- description, name, attributes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_workspace ON products(workspace_id);
CREATE INDEX IF NOT EXISTS idx_products_external ON products(external_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_product_vectors_product ON product_vectors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_vectors_embedding ON product_vectors USING hnsw (embedding vector_cosine_ops);
