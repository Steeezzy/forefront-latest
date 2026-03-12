import { pool } from './src/config/db.js';
import { generateEmbedding } from './src/utils/embeddings.js';
import { DocumentIngestionService } from './src/services/rag/DocumentIngestionService.js';

const AGENT_ID = 'ade07442-1e91-48c9-a6d1-6a6e8262e73c';

async function reindex() {
    const ingestSvc = new DocumentIngestionService();
    try {
        console.log(`Starting recovery re-index for agent: ${AGENT_ID} using nomic-embed-text-v1`);

        // 1. Fetch website pages
        const { rows: pages } = await pool.query(`
            SELECT id, knowledge_source_id, content 
            FROM website_pages 
            WHERE knowledge_source_id IN (SELECT id FROM knowledge_sources WHERE agent_id = $1)
        `, [AGENT_ID]);
        console.log(`Found ${pages.length} website pages.`);

        // 2. Fetch Q&A pairs
        const { rows: qnas } = await pool.query(`
            SELECT id, knowledge_source_id, question, answer 
            FROM qna_pairs 
            WHERE knowledge_source_id IN (SELECT id FROM knowledge_sources WHERE agent_id = $1)
        `, [AGENT_ID]);
        console.log(`Found ${qnas.length} Q&A pairs.`);

        // 3. Clear old vectors
        console.log('Clearing old vectors...');
        await pool.query(`
            DELETE FROM knowledge_vectors 
            WHERE source_id IN (SELECT id FROM knowledge_sources WHERE agent_id = $1)
        `, [AGENT_ID]);

        // 4. Process Pages
        for (const page of pages) {
            if (!page.content) continue;
            const chunks = ingestSvc.splitText(page.content, { strategy: 'fixed_size', chunk_size: 512, chunk_overlap: 50 });
            for (const chunk of chunks) {
                try {
                    const vector = await generateEmbedding(chunk.text);
                    console.log(`Embedding dimensions: ${vector.length}`);
                    await pool.query(`
                        INSERT INTO knowledge_vectors (source_id, page_id, content_chunk, embedding)
                        VALUES ($1, $2, $3, $4::vector)
                    `, [page.knowledge_source_id, page.id, chunk.text, JSON.stringify(vector)]);
                } catch (err: any) {
                    console.error(`Failed to index page chunk:`, err.message);
                }
            }
            console.log(`✅ Indexed page: ${page.id.substring(0, 8)}`);
        }

        // 5. Process Q&As
        for (const qna of qnas) {
            try {
                const text = `Question: ${qna.question}\nAnswer: ${qna.answer}`;
                const vector = await generateEmbedding(text);
                console.log(`Embedding dimensions: ${vector.length}`);
                await pool.query(`
                    INSERT INTO knowledge_vectors (source_id, content_chunk, embedding)
                    VALUES ($1, $2, $3::vector)
                `, [qna.knowledge_source_id, text, JSON.stringify(vector)]);
                console.log(`✅ Indexed Q&A: ${qna.id.substring(0, 8)}`);
            } catch (err: any) {
                console.error(`Failed to index Q&A:`, err.message);
            }
        }

        // 6. Verification
        const verifyRes = await pool.query(`
            SELECT COUNT(*) as total, vector_dims(embedding) as dimensions
            FROM knowledge_vectors kv
            JOIN knowledge_sources ks ON kv.source_id = ks.id
            WHERE ks.agent_id = $1
            GROUP BY vector_dims(embedding);
        `, [AGENT_ID]);

        console.log('\n--- Verification ---');
        console.table(verifyRes.rows);
        console.log('✅ Re-indexing complete!');
    } catch (err) {
        console.error('Re-indexing failed:', err);
    } finally {
        await pool.end();
    }
}

reindex();
