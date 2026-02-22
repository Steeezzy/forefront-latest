# 05 — Knowledge Base

## Current State
- ✅ Knowledge sources table (pdf, text, url, qa_pair)
- ✅ Knowledge vectors table (pgvector, HNSW index, 384-dim embeddings)
- ✅ Website scraping service (Cheerio-based)
- ✅ CSV import service
- ✅ Zendesk import service
- ✅ Manual Q&A service
- ✅ Chunking utility (text splitter)
- ✅ Embedding utility (fastembed BAAI/bge-small-en-v1.5)
- ❌ No product catalog integration
- ❌ No knowledge suggestions (auto-learn from chats)
- ❌ No bulk operations or re-indexing
- ❌ No knowledge source health monitoring
- ❌ No version history or diffs

---

## What Tidio Has
- Website URL scraping
- Help center import (Zendesk, Intercom)
- Manual Q&A pairs
- CSV file upload
- Product catalog integration (Shopify)
- Auto-learn from solved chats
- Knowledge suggestions (unanswered questions → new Q&A)
- Audience segmentation (limit knowledge per use case)

---

## Implementation Plan

### Step 1: Knowledge Source Enhancement

```sql
-- Migration: 016_knowledge_enhancement.sql
ALTER TABLE knowledge_sources ADD COLUMN name VARCHAR(255);
ALTER TABLE knowledge_sources ADD COLUMN source_url TEXT;
ALTER TABLE knowledge_sources ADD COLUMN metadata JSONB DEFAULT '{}';
ALTER TABLE knowledge_sources ADD COLUMN chunk_count INTEGER DEFAULT 0;
ALTER TABLE knowledge_sources ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE knowledge_sources ADD COLUMN sync_frequency VARCHAR(50); -- manual, daily, weekly
ALTER TABLE knowledge_sources ADD COLUMN error_message TEXT;
```

### Step 2: Product Catalog

```sql
-- Migration: 017_product_catalog.sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  external_id VARCHAR(255), -- Shopify product ID
  name VARCHAR(500) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'INR',
  image_url TEXT,
  product_url TEXT,
  category VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vectorize product descriptions for semantic search
CREATE TABLE product_vectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_chunk TEXT NOT NULL,
  embedding vector(384),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_vectors_embedding ON product_vectors USING hnsw (embedding vector_cosine_ops);
```

**API Endpoints:**
- `POST /knowledge/products/import` — Import from Shopify/CSV
- `GET /knowledge/products` — List products
- `POST /knowledge/products` — Add single product
- `PATCH /knowledge/products/:id` — Update product
- `DELETE /knowledge/products/:id` — Remove product
- `POST /knowledge/products/sync` — Re-sync from Shopify

### Step 3: Auto-Learn from Chats
**Service: `services/KnowledgeLearner.ts`**

```typescript
class KnowledgeLearner {
  // After an agent resolves a chat, extract potential Q&A pairs
  async extractFromResolvedChat(conversationId: string): Promise<void> {
    const messages = await chatService.getMessages(conversationId);

    // Find visitor question → agent answer pairs
    const pairs = this.extractQAPairs(messages);

    for (const pair of pairs) {
      // Check if similar Q already exists
      const exists = await this.findSimilarKnowledge(pair.question);
      if (!exists) {
        await this.createSuggestion(pair);
      }
    }
  }

  private extractQAPairs(messages: Message[]): QAPair[] {
    // Group consecutive visitor→agent message pairs
    // Use Sarvam AI to summarize into clean Q&A format
  }
}
```

### Step 4: Knowledge Suggestions Dashboard
**Enhance existing `/chatbot/suggestions` page:**

- `GET /knowledge/suggestions` — List unanswered/suggested Q&A
- `POST /knowledge/suggestions/:id/approve` — Approve and add to knowledge base
- `POST /knowledge/suggestions/:id/reject` — Dismiss suggestion
- `POST /knowledge/suggestions/:id/edit` — Edit before approving

### Step 5: Bulk Operations & Re-indexing

- `POST /knowledge/reindex` — Re-embed all knowledge for a workspace
- `DELETE /knowledge/sources/:id` — Delete source + cascade vectors
- `POST /knowledge/sources/:id/refresh` — Re-scrape URL and update vectors

### Step 6: Background Job Queue (BullMQ)
**Move heavy operations to background:**

```typescript
// jobs/knowledgeJobs.ts
import { Queue, Worker } from 'bullmq';

const knowledgeQueue = new Queue('knowledge', { connection: redisConfig });

// Job types:
// - scrape_website: Crawl URL → chunk → embed → store
// - import_csv: Parse CSV → create Q&A pairs → embed
// - sync_products: Fetch from Shopify → update catalog → embed
// - reindex_source: Re-embed existing source
// - auto_learn: Extract Q&A from resolved chats

const knowledgeWorker = new Worker('knowledge', async (job) => {
  switch (job.name) {
    case 'scrape_website':
      await websiteScrapingService.scrape(job.data);
      break;
    case 'import_csv':
      await csvImportService.process(job.data);
      break;
    // ...
  }
}, { connection: redisConfig });
```

---

## Frontend Changes Required
> ⚠️ ASK USER BEFORE IMPLEMENTING

- Product catalog page in Chatbot → Products
- Product import wizard (Shopify connect or CSV upload)
- Knowledge suggestions review page
- Re-index and sync buttons on data sources
- Progress indicators for background jobs
