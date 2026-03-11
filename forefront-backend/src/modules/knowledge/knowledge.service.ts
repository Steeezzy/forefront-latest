import { pool, query } from '../../config/db.js';
import { splitText } from '../../utils/chunking.js';
import { generateEmbedding } from '../../utils/embeddings.js';

export class KnowledgeService {
    async addSource(workspaceId: string, agentId: string, type: 'text' | 'url' | 'pdf' | 'qa_pair', content: string) {
        console.log(`Adding knowledge source for agent ${agentId}, type: ${type}`);

        // For URL types, delegate to WebsiteScrapingService which handles
        // scraping, embedding, and Q&A generation properly
        if (type === 'url') {
            const { WebsiteScrapingService } = await import('../../services/WebsiteScrapingService.js');
            const websiteService = new WebsiteScrapingService();
            const source = await websiteService.addWebsiteSource(agentId, content, undefined, 'single');
            return { sourceId: source.id, chunks: 0, message: 'Website scraping started' };
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Create Source
            const sourceRes = await client.query(
                `INSERT INTO knowledge_sources (agent_id, type, content, status) 
                 VALUES ($1, $2, $3, 'pending') 
                 RETURNING id`,
                [agentId, type, content]
            );
            const sourceId = sourceRes.rows[0].id;

            // 2. Process Content (Text Splitting)
            const chunks = await splitText(content);
            console.log(`Generated ${chunks.length} chunks`);

            // 3. Generate Embeddings & Store Vectors
            for (const chunk of chunks) {
                const embedding = await generateEmbedding(chunk);
                const embeddingStr = `[${embedding.join(',')}]`;
                await client.query(
                    `INSERT INTO knowledge_vectors (source_id, content_chunk, embedding) 
                     VALUES ($1, $2, $3::vector)`,
                    [sourceId, chunk, embeddingStr]
                );
            }

            // 4. Update Status
            await client.query(
                `UPDATE knowledge_sources SET status = 'indexed' WHERE id = $1`,
                [sourceId]
            );

            await client.query('COMMIT');
            return { sourceId, chunks: chunks.length };
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Failed to add knowledge source', e);
            throw e;
        } finally {
            client.release();
        }
    }

    async getSources(agentId: string) {
        const res = await query('SELECT * FROM knowledge_sources WHERE agent_id = $1 ORDER BY created_at DESC', [agentId]);
        return res.rows;
    }
}
