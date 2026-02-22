import { pool } from '../config/db.js';
import { ManualQnAService } from './ManualQnAService.js';
export class ZendeskService {
    constructor() {
        this.qnaService = new ManualQnAService();
    }
    /**
     * Import articles from Zendesk Help Center
     */
    async importFromZendesk(agentId, subdomain, email, apiToken) {
        // 1. Test connection first
        const baseURL = `https://${subdomain}.zendesk.com/api/v2`;
        const authHeader = 'Basic ' + Buffer.from(`${email}/token:${apiToken}`).toString('base64');
        // 2. Create knowledge source
        const sourceRes = await pool.query(`INSERT INTO knowledge_sources (agent_id, type, content, url, name, status, metadata)
             VALUES ($1, 'zendesk', 'Zendesk Help Center', $2, $3, 'processing', $4)
             RETURNING *`, [
            agentId,
            `https://${subdomain}.zendesk.com`,
            `Zendesk - ${subdomain}`,
            JSON.stringify({ subdomain, email })
        ]);
        const source = sourceRes.rows[0];
        try {
            // 3. Fetch all articles
            const articles = await this.fetchAllArticles(baseURL, authHeader);
            // 4. Create processing job
            const jobRes = await pool.query(`INSERT INTO processing_jobs (knowledge_source_id, job_type, status, total_items, started_at)
                 VALUES ($1, 'import', 'processing', $2, NOW())
                 RETURNING id`, [source.id, articles.length]);
            const jobId = jobRes.rows[0].id;
            let processedCount = 0;
            // 5. Import each article as Q&A pair
            for (const article of articles) {
                try {
                    // Strip HTML from article body
                    const plainBody = this.stripHtml(article.body || '');
                    if (article.title && plainBody.length > 10) {
                        await this.qnaService.addQnAPair(source.id, article.title, plainBody, article.section_name || null);
                    }
                    processedCount++;
                    const progress = Math.round((processedCount / articles.length) * 100);
                    await pool.query(`UPDATE processing_jobs SET processed_items = $2, progress = $3 WHERE id = $1`, [jobId, processedCount, progress]);
                }
                catch (err) {
                    console.error('Error importing Zendesk article:', err.message);
                }
            }
            // 6. Mark completed
            await pool.query(`UPDATE knowledge_sources SET status = 'completed', last_synced_at = NOW() WHERE id = $1`, [source.id]);
            await pool.query(`UPDATE processing_jobs SET status = 'completed', progress = 100, completed_at = NOW() WHERE id = $1`, [jobId]);
            return { source, total: articles.length, imported: processedCount };
        }
        catch (error) {
            await pool.query(`UPDATE knowledge_sources SET status = 'failed', error_message = $2 WHERE id = $1`, [source.id, error.message]);
            throw error;
        }
    }
    /**
     * Fetch all published articles from Zendesk Help Center API
     */
    async fetchAllArticles(baseURL, authHeader) {
        const articles = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
            const response = await fetch(`${baseURL}/help_center/articles.json?page=${page}&per_page=100`, {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Zendesk API Error (${response.status}): ${errorText}`);
            }
            const data = await response.json();
            articles.push(...(data.articles || []));
            hasMore = data.next_page !== null;
            page++;
            // Safety: max 1000 articles
            if (articles.length >= 1000)
                break;
        }
        return articles;
    }
    /**
     * Strip HTML tags from text
     */
    stripHtml(html) {
        return html
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
