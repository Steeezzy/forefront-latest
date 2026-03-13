import { pool } from '../config/db.js';
import { splitText } from '../utils/chunking.js';
import { generateEmbedding } from '../utils/embeddings.js';

async function reindex() {
  console.log('🚀 Starting Re-indexing of Knowledge Base...');
  
  const client = await pool.connect();
  
  try {
    // 1. Get all pending sources
    const { rows: sources } = await client.query(
      "SELECT * FROM knowledge_sources WHERE status = 'pending'"
    );
    
    console.log(`📊 Found ${sources.length} pending sources to index.`);
    
    for (const source of sources) {
      console.log(`\n📦 Processing source: ${source.name || source.id} (${source.type})`);
      
      if (source.type === 'website' || source.type === 'url') {
        // Process website pages
        const { rows: pages } = await client.query(
          "SELECT * FROM website_pages WHERE knowledge_source_id = $1",
          [source.id]
        );
        
        console.log(`📄 Found ${pages.length} pages for this source.`);
        
        for (const page of pages) {
          console.log(`  🔍 Indexing page: ${page.url}`);
          const chunks = await splitText(page.content, 800, 100);
          
          for (const chunk of chunks) {
            try {
              const embedding = await generateEmbedding(chunk);
              const embeddingStr = `[${embedding.join(',')}]`;
              await client.query(
                `INSERT INTO knowledge_vectors (source_id, page_id, content_chunk, embedding)
                 VALUES ($1, $2, $3, $4::vector)`,
                [source.id, page.id, chunk, embeddingStr]
              );
            } catch (err: any) {
              console.error(`  ❌ Failed to embed chunk for ${page.url}:`, err.message);
            }
          }
        }
      } else {
        // Process raw text/PDF content
        if (source.content) {
          const chunks = await splitText(source.content, 800, 100);
          console.log(`  📝 Indexing raw content (${chunks.length} chunks)`);
          
          for (const chunk of chunks) {
            const embedding = await generateEmbedding(chunk);
            const embeddingStr = `[${embedding.join(',')}]`;
            await client.query(
              `INSERT INTO knowledge_vectors (source_id, content_chunk, embedding)
               VALUES ($1, $2, $3, $4::vector)`,
              [source.id, chunk, embeddingStr]
            );
          }
        }
      }
      
      // Also index Q&A pairs if they exist
      const { rows: qnas } = await client.query(
        "SELECT * FROM qna_pairs WHERE knowledge_source_id = $1",
        [source.id]
      );
      
      if (qnas.length > 0) {
        console.log(`  ❓ Indexing ${qnas.length} Q&A pairs...`);
        for (const qna of qnas) {
          const combinedText = `Question: ${qna.question}\nAnswer: ${qna.answer}`;
          const embedding = await generateEmbedding(combinedText);
          const embeddingStr = `[${embedding.join(',')}]`;
          await client.query(
            `INSERT INTO knowledge_vectors (source_id, content_chunk, embedding, category)
             VALUES ($1, $2, $3, 'qa_pair')`,
            [source.id, combinedText, embeddingStr]
          );
        }
      }
      
      // Update status to completed/indexed
      await client.query(
        "UPDATE knowledge_sources SET status = 'completed', last_synced_at = NOW() WHERE id = $1",
        [source.id]
      );
      console.log(`✅ Completed indexing source: ${source.name || source.id}`);
    }
    
    console.log('\n✨ All pending knowledge sources have been indexed successfully!');
  } catch (error) {
    console.error('❌ Re-indexing failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

reindex();
