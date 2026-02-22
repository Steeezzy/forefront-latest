import * as cheerio from 'cheerio';
import { pool } from '../config/db.js';
import { splitText } from '../utils/chunking.js';
import { generateEmbedding } from '../utils/embeddings.js';
export class WebsiteScrapingService {
    constructor() {
        this.maxDepth = 3;
        this.maxPages = 50;
        this.timeout = 15000; // 15 seconds per page
    }
    /**
     * Add a website as a knowledge source and start scraping in background
     */
    async addWebsiteSource(agentId, url, name) {
        // Validate URL
        try {
            new URL(url);
        }
        catch {
            throw new Error('Invalid URL provided');
        }
        // Create knowledge source
        const result = await pool.query(`INSERT INTO knowledge_sources (agent_id, type, content, url, status, name)
             VALUES ($1, 'website', $2, $2, 'pending', $3)
             RETURNING *`, [agentId, url, name || url]);
        const source = result.rows[0];
        // Start scraping in background (fire-and-forget)
        this.startScraping(source.id, url).catch(err => {
            console.error('Scraping error:', err);
            this.updateSourceStatus(source.id, 'failed', err.message);
        });
        return source;
    }
    /**
     * Main scraping process — runs in background
     */
    async startScraping(sourceId, startUrl) {
        await this.updateSourceStatus(sourceId, 'processing');
        // Create processing job
        const jobRes = await pool.query(`INSERT INTO processing_jobs (knowledge_source_id, job_type, status, started_at)
             VALUES ($1, 'scrape', 'processing', NOW())
             RETURNING id`, [sourceId]);
        const jobId = jobRes.rows[0].id;
        const visited = new Set();
        const queue = [{ url: startUrl, depth: 0 }];
        const scrapedPages = [];
        try {
            while (queue.length > 0 && scrapedPages.length < this.maxPages) {
                const item = queue.shift();
                const { url, depth } = item;
                if (visited.has(url) || depth > this.maxDepth)
                    continue;
                visited.add(url);
                try {
                    const pageData = await this.scrapePage(url);
                    if (pageData && pageData.content.length > 50) {
                        // Save page to DB
                        const savedPage = await this.savePage(sourceId, pageData);
                        scrapedPages.push(savedPage);
                        // Generate embeddings for the page content
                        await this.generatePageEmbeddings(sourceId, pageData.content);
                        // Extract links for further crawling
                        if (depth < this.maxDepth) {
                            const links = this.extractLinks(pageData.html, url);
                            for (const link of links) {
                                if (!visited.has(link)) {
                                    queue.push({ url: link, depth: depth + 1 });
                                }
                            }
                        }
                        // Update job progress
                        await this.updateJobProgress(jobId, scrapedPages.length, this.maxPages);
                    }
                }
                catch (err) {
                    console.error(`Failed to scrape ${url}:`, err.message);
                }
            }
            // Mark completed
            await this.updateSourceStatus(sourceId, 'completed');
            await this.completeJob(jobId, scrapedPages.length);
            console.log(`✅ Scraped ${scrapedPages.length} pages from ${startUrl}`);
            return scrapedPages;
        }
        catch (error) {
            await this.updateSourceStatus(sourceId, 'failed', error.message);
            await this.failJob(jobId, error.message);
            throw error;
        }
    }
    /**
     * Scrape a single page using fetch + cheerio (no Puppeteer)
     */
    async scrapePage(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'ForefrontBot/1.0 (Knowledge Base Crawler)',
                    'Accept': 'text/html,application/xhtml+xml'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok)
                return null;
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('text/html'))
                return null;
            const html = await response.text();
            const $ = cheerio.load(html);
            // Remove unwanted elements
            $('script, style, nav, header, footer, iframe, noscript, aside, [role="navigation"]').remove();
            const title = $('title').text().trim() || $('h1').first().text().trim() || url;
            const content = $('body').text()
                .replace(/\s+/g, ' ')
                .trim();
            return {
                url,
                title,
                content,
                html,
                word_count: content.split(/\s+/).length
            };
        }
        catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                console.warn(`Timeout scraping ${url}`);
            }
            return null;
        }
    }
    /**
     * Save scraped page to website_pages table
     */
    async savePage(sourceId, pageData) {
        const result = await pool.query(`INSERT INTO website_pages (knowledge_source_id, url, title, content, html, word_count, last_crawled_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (knowledge_source_id, url)
             DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content,
                           html = EXCLUDED.html, word_count = EXCLUDED.word_count,
                           last_crawled_at = NOW()
             RETURNING *`, [sourceId, pageData.url, pageData.title, pageData.content, pageData.html, pageData.word_count]);
        return result.rows[0];
    }
    /**
     * Chunk page content and generate embeddings
     */
    async generatePageEmbeddings(sourceId, content) {
        const chunks = await splitText(content, 800, 100);
        for (const chunk of chunks) {
            const embedding = await generateEmbedding(chunk);
            await pool.query(`INSERT INTO knowledge_vectors (source_id, content_chunk, embedding)
                 VALUES ($1, $2, $3)`, [sourceId, chunk, JSON.stringify(embedding)]);
        }
    }
    /**
     * Extract same-origin links from HTML
     */
    extractLinks(html, baseUrl) {
        const $ = cheerio.load(html);
        const links = [];
        const base = new URL(baseUrl);
        $('a[href]').each((_, el) => {
            try {
                const href = $(el).attr('href');
                if (!href)
                    return;
                const fullUrl = new URL(href, base).href;
                // Only same-origin, no anchors, no query-heavy URLs
                if (fullUrl.startsWith(base.origin) && !fullUrl.includes('#') && fullUrl.split('?').length <= 2) {
                    links.push(fullUrl.split('?')[0]); // Strip query params
                }
            }
            catch {
                // Invalid URL, skip
            }
        });
        return [...new Set(links)];
    }
    // ---- Helper methods for status tracking ----
    async updateSourceStatus(sourceId, status, errorMessage) {
        const values = [sourceId, status];
        let extraFields = '';
        if (status === 'completed')
            extraFields += ', last_synced_at = NOW()';
        if (errorMessage) {
            extraFields += `, error_message = $${values.length + 1}`;
            values.push(errorMessage);
        }
        await pool.query(`UPDATE knowledge_sources SET status = $2, updated_at = NOW() ${extraFields} WHERE id = $1`, values);
    }
    async updateJobProgress(jobId, processed, total) {
        const progress = Math.round((processed / total) * 100);
        await pool.query(`UPDATE processing_jobs SET processed_items = $2, total_items = $3, progress = $4 WHERE id = $1`, [jobId, processed, total, progress]);
    }
    async completeJob(jobId, itemsProcessed) {
        await pool.query(`UPDATE processing_jobs SET status = 'completed', processed_items = $2, progress = 100, completed_at = NOW() WHERE id = $1`, [jobId, itemsProcessed]);
    }
    async failJob(jobId, errorMessage) {
        await pool.query(`UPDATE processing_jobs SET status = 'failed', error_message = $2, completed_at = NOW() WHERE id = $1`, [jobId, errorMessage]);
    }
}
