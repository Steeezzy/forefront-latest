import * as cheerio from 'cheerio';
import { pool } from '../config/db.js';
import { splitText } from '../utils/chunking.js';
import { generateEmbedding } from '../utils/embeddings.js';
// Keywords that indicate high-priority pages for customer support / knowledge base
const PRIORITY_KEYWORDS = [
    { pattern: /\/(faq|faqs|frequently-asked)/i, score: 10 },
    { pattern: /\/(help|support|customer-service)/i, score: 10 },
    { pattern: /\/(about|about-us|who-we-are)/i, score: 9 },
    { pattern: /\/(contact|contact-us|get-in-touch)/i, score: 8 },
    { pattern: /\/(pricing|plans|packages)/i, score: 8 },
    { pattern: /\/(returns|refund|exchange|cancellation)/i, score: 7 },
    { pattern: /\/(shipping|delivery|tracking)/i, score: 7 },
    { pattern: /\/(terms|terms-of-service|terms-and-conditions)/i, score: 6 },
    { pattern: /\/(privacy|privacy-policy|cookie-policy)/i, score: 6 },
    { pattern: /\/(warranty|guarantee)/i, score: 6 },
    { pattern: /\/(how-it-works|getting-started|guide)/i, score: 5 },
    { pattern: /\/(features|services|products)/i, score: 5 },
    { pattern: /\/(blog|news|updates)/i, score: 2 },
];
export class WebsiteScrapingService {
    maxDepth = 3;
    maxPages = 50;
    priorityMaxPages = 20;
    timeout = 15000;
    /**
     * Add a website as a knowledge source and start scraping
     * @param mode 'priority' — discover & rank priority pages; 'single' — scrape only the provided URL
     */
    async addWebsiteSource(agentId, url, name, mode = 'priority') {
        try {
            new URL(url);
        }
        catch {
            throw new Error('Invalid URL provided');
        }
        const result = await pool.query(`INSERT INTO knowledge_sources (agent_id, type, content, url, status, name, scrape_mode)
             VALUES ($1, 'website', $2, $2, 'pending', $3, $4)
             RETURNING *`, [agentId, url, name || new URL(url).hostname, mode]);
        const source = result.rows[0];
        // Fire-and-forget based on mode
        if (mode === 'single') {
            this.scrapeSinglePage(source.id, url).catch(err => {
                console.error('Single page scraping error:', err);
                this.updateSourceStatus(source.id, 'failed', err.message);
            });
        }
        else {
            this.scrapePriorityPages(source.id, url).catch(err => {
                console.error('Priority scraping error:', err);
                this.updateSourceStatus(source.id, 'failed', err.message);
            });
        }
        return source;
    }
    // Track last scrape error for better error messages
    lastScrapeError = null;
    // ================================================================
    // MODE 1: Scan Single Page
    // ================================================================
    /**
     * Scrape ONLY the given URL — no crawling.
     */
    async scrapeSinglePage(sourceId, url) {
        await this.updateSourceStatus(sourceId, 'processing');
        const jobId = await this.createJob(sourceId);
        this.lastScrapeError = null;
        try {
            const pageData = await this.scrapePage(url);
            if (!pageData || pageData.content.length < 50) {
                const errorMsg = this.lastScrapeError || `Page at ${url} has no meaningful content to extract.`;
                throw new Error(errorMsg);
            }
            const savedPage = await this.savePage(sourceId, pageData, 10);
            // Post-processing: embeddings (non-fatal — page is still valid without embeddings)
            try {
                await this.generatePageEmbeddings(sourceId, savedPage.id, pageData.content);
            }
            catch (embErr) {
                console.warn(`⚠️ Embedding failed for ${url}: ${embErr.message}`);
            }
            // Post-processing: Sarvam AI summarization (non-fatal)
            try {
                await this.sarvamSummarizePage(sourceId, savedPage.id, pageData.content);
            }
            catch (sumErr) {
                console.warn(`⚠️ Summarization failed for ${url}: ${sumErr.message}`);
            }
            // Post-processing: Sarvam AI Q&A generation (non-fatal)
            try {
                await this.sarvamGenerateQnA(sourceId, pageData.content, pageData.title);
            }
            catch (qnaErr) {
                console.warn(`⚠️ Q&A generation failed for ${url}: ${qnaErr.message}`);
            }
            await this.updateSourceStatus(sourceId, 'completed');
            await this.completeJob(jobId, 1);
            console.log(`✅ [single] Scraped 1 page: ${url}`);
            return [savedPage];
        }
        catch (error) {
            await this.updateSourceStatus(sourceId, 'failed', error.message);
            await this.failJob(jobId, error.message);
            throw error;
        }
    }
    // ================================================================
    // MODE 2: Scan Priority Pages
    // ================================================================
    /**
     * Discover priority pages from the domain and scrape them.
     * Strategy: sitemap.xml → keyword scoring → BFS fallback
     */
    async scrapePriorityPages(sourceId, startUrl) {
        await this.updateSourceStatus(sourceId, 'processing');
        this.lastScrapeError = null;
        const jobId = await this.createJob(sourceId);
        const base = new URL(startUrl);
        try {
            // Step 1: Try sitemap discovery
            let urls = await this.discoverFromSitemap(base.origin);
            // Step 2: If sitemap gave few results, run BFS crawl to discover more
            if (urls.length < 5) {
                console.log(`Sitemap yielded ${urls.length} URLs, falling back to BFS crawl`);
                const crawledUrls = await this.bfsCrawl(startUrl, this.maxDepth, this.maxPages);
                urls = [...new Set([...urls, ...crawledUrls])];
            }
            // Step 3: Always include the root URL
            if (!urls.includes(startUrl))
                urls.unshift(startUrl);
            // Step 4: Score and rank by priority
            const scoredUrls = urls.map(u => ({ url: u, score: this.scorePriority(u, base.origin) }));
            scoredUrls.sort((a, b) => b.score - a.score);
            const topUrls = scoredUrls.slice(0, this.priorityMaxPages);
            console.log(`📊 Discovered ${urls.length} URLs, scraping top ${topUrls.length} priority pages`);
            // Step 5: Scrape each page
            const scrapedPages = [];
            for (const { url, score } of topUrls) {
                try {
                    const pageData = await this.scrapePage(url);
                    if (pageData && pageData.content.length > 50) {
                        const savedPage = await this.savePage(sourceId, pageData, score);
                        // Count page as scraped BEFORE post-processing (embedding/AI)
                        // so that post-processing failures don't mark the entire job as failed
                        scrapedPages.push(savedPage);
                        await this.updateJobProgress(jobId, scrapedPages.length, topUrls.length);
                        // Post-processing: embeddings (non-fatal)
                        try {
                            await this.generatePageEmbeddings(sourceId, savedPage.id, pageData.content);
                        }
                        catch (embErr) {
                            console.warn(`⚠️ Embedding failed for ${url}: ${embErr.message}`);
                        }
                        // Post-processing: Sarvam AI summarization (non-fatal)
                        try {
                            await this.sarvamSummarizePage(sourceId, savedPage.id, pageData.content);
                        }
                        catch (sumErr) {
                            console.warn(`⚠️ Summarization failed for ${url}: ${sumErr.message}`);
                        }
                    }
                }
                catch (err) {
                    console.error(`Failed to scrape ${url}:`, err.message);
                }
            }
            // Step 6: Generate Q&A from all combined content
            if (scrapedPages.length > 0) {
                const combinedContent = scrapedPages
                    .map((p) => `## ${p.title}\n${p.content}`)
                    .join('\n\n')
                    .slice(0, 8000); // Limit for LLM context
                await this.sarvamGenerateQnA(sourceId, combinedContent, base.hostname);
            }
            // If no pages were scraped, mark as failed
            if (scrapedPages.length === 0) {
                const errorMsg = this.lastScrapeError || 'No pages could be scraped. The website may be blocking automated access or requires JavaScript rendering.';
                console.error(`❌ [priority] ${errorMsg}`);
                await this.updateSourceStatus(sourceId, 'failed', errorMsg);
                await this.failJob(jobId, errorMsg);
                return [];
            }
            await this.updateSourceStatus(sourceId, 'completed');
            await this.completeJob(jobId, scrapedPages.length);
            console.log(`✅ [priority] Scraped ${scrapedPages.length} pages from ${base.hostname}`);
            return scrapedPages;
        }
        catch (error) {
            await this.updateSourceStatus(sourceId, 'failed', error.message);
            await this.failJob(jobId, error.message);
            throw error;
        }
    }
    // ================================================================
    // Sitemap Discovery
    // ================================================================
    /**
     * Fetch and parse /sitemap.xml to discover page URLs
     */
    async discoverFromSitemap(origin) {
        const urls = [];
        try {
            const sitemapUrl = `${origin}/sitemap.xml`;
            const discovered = await this.parseSitemapRecursive(sitemapUrl, origin, 0);
            urls.push(...discovered);
            console.log(`📄 Sitemap: found ${urls.length} page URLs from ${origin}`);
        }
        catch (err) {
            console.log(`No sitemap found at ${origin}/sitemap.xml: ${err.message}`);
        }
        return urls;
    }
    /**
     * Recursively parse sitemaps — handles both sitemap indexes and regular sitemaps.
     * WordPress and many CMS platforms use a sitemap index (sitemapindex) that links
     * to sub-sitemaps containing actual page URLs.
     */
    async parseSitemapRecursive(sitemapUrl, origin, depth) {
        if (depth > 3)
            return []; // Prevent infinite recursion
        const urls = [];
        try {
            const response = await fetch(sitemapUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ForefrontBot/1.0)' },
                signal: AbortSignal.timeout(10000),
            });
            if (!response.ok)
                return urls;
            const xml = await response.text();
            const $ = cheerio.load(xml, { xmlMode: true });
            // Check if this is a sitemap INDEX (contains <sitemap> elements)
            const sitemapEntries = $('sitemap > loc');
            if (sitemapEntries.length > 0) {
                console.log(`📄 Sitemap index at ${sitemapUrl}: ${sitemapEntries.length} sub-sitemaps`);
                for (let i = 0; i < sitemapEntries.length; i++) {
                    const subSitemapUrl = $(sitemapEntries[i]).text().trim();
                    if (subSitemapUrl) {
                        const subUrls = await this.parseSitemapRecursive(subSitemapUrl, origin, depth + 1);
                        urls.push(...subUrls);
                    }
                }
            }
            else {
                // Regular sitemap — extract <url><loc> entries
                $('url > loc').each((_, el) => {
                    const loc = $(el).text().trim();
                    if (loc && loc.startsWith(origin)) {
                        urls.push(loc);
                    }
                });
                if (urls.length > 0) {
                    console.log(`📄 Sub-sitemap ${sitemapUrl}: ${urls.length} URLs`);
                }
            }
        }
        catch (err) {
            console.log(`Failed to parse sitemap ${sitemapUrl}: ${err.message}`);
        }
        return urls;
    }
    // ================================================================
    // BFS Crawl (fallback)
    // ================================================================
    async bfsCrawl(startUrl, maxDepth, maxPages) {
        const visited = new Set();
        const queue = [{ url: startUrl, depth: 0 }];
        const discoveredUrls = [];
        while (queue.length > 0 && discoveredUrls.length < maxPages) {
            const item = queue.shift();
            const { url, depth } = item;
            if (visited.has(url) || depth > maxDepth)
                continue;
            visited.add(url);
            discoveredUrls.push(url);
            if (depth < maxDepth) {
                try {
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                            'Sec-Ch-Ua-Mobile': '?0',
                            'Sec-Ch-Ua-Platform': '"Windows"',
                            'Sec-Fetch-Dest': 'document',
                            'Sec-Fetch-Mode': 'navigate',
                            'Sec-Fetch-Site': 'none',
                            'Sec-Fetch-User': '?1',
                            'Upgrade-Insecure-Requests': '1'
                        },
                        signal: AbortSignal.timeout(this.timeout),
                    });
                    if (response.ok) {
                        const html = await response.text();
                        const links = this.extractLinks(html, url);
                        for (const link of links) {
                            if (!visited.has(link)) {
                                queue.push({ url: link, depth: depth + 1 });
                            }
                        }
                    }
                }
                catch {
                    // Skip failed pages
                }
            }
        }
        return discoveredUrls;
    }
    // ================================================================
    // Priority Scoring
    // ================================================================
    /**
     * Score a URL based on keyword matches — higher = more relevant for knowledge base
     */
    scorePriority(url, origin) {
        const path = url.replace(origin, '');
        // Homepage always gets max score
        if (path === '' || path === '/')
            return 10;
        let maxScore = 1; // Default for unrecognized paths
        for (const { pattern, score } of PRIORITY_KEYWORDS) {
            if (pattern.test(path)) {
                maxScore = Math.max(maxScore, score);
            }
        }
        // Penalize very deep paths (many slashes = likely blog posts, not core pages)
        const pathDepth = (path.match(/\//g) || []).length;
        if (pathDepth > 3)
            maxScore = Math.max(1, maxScore - 2);
        return maxScore;
    }
    // ================================================================
    // Page Scraping (shared by both modes)
    // ================================================================
    async scrapePage(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        console.log(`🔍 Scraping: ${url}`);
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const statusCode = response.status;
                let errorDetail = `HTTP ${statusCode}`;
                // Detect common bot protection responses
                if (statusCode === 403) {
                    const server = response.headers.get('server') || '';
                    if (server.toLowerCase().includes('akamai')) {
                        errorDetail = 'Blocked by Akamai CDN - this site requires a real browser and cannot be scraped automatically';
                    }
                    else if (server.toLowerCase().includes('cloudflare')) {
                        errorDetail = 'Blocked by Cloudflare - this site requires browser verification and cannot be scraped automatically';
                    }
                    else {
                        errorDetail = 'Access forbidden (403) - this site has bot protection that blocks automated access';
                    }
                }
                else if (statusCode === 503) {
                    errorDetail = 'Service unavailable (503) - possible rate limiting or bot check';
                }
                else if (statusCode === 429) {
                    errorDetail = 'Too many requests (429) - rate limited by the website';
                }
                console.warn(`⚠️ ${errorDetail} for ${url}`);
                this.lastScrapeError = errorDetail;
                return null;
            }
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('text/html')) {
                console.warn(`⚠️ Non-HTML content (${contentType}) for ${url}`);
                return null;
            }
            const html = await response.text();
            const $ = cheerio.load(html);
            // Aggressively remove non-content elements
            const noiseSelectors = [
                'script', 'style', 'noscript', 'iframe',
                'nav', 'header', 'footer',
                '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
                '.cookie-banner', '.popup', '.modal', '.overlay',
                '.announcement-bar', '.promo-bar', '.top-bar',
                '.newsletter', '.subscribe', '.social-links',
                '.breadcrumb', '.breadcrumbs', '.pagination',
                '.sidebar', '.widget', '.ad', '.advertisement',
                '#cookie-consent', '#popup', '#newsletter',
                '[aria-hidden="true"]', '.sr-only', '.visually-hidden',
                '.cart-drawer', '.mini-cart', '.search-overlay',
                '.tooltip', '.dropdown-menu',
            ];
            $(noiseSelectors.join(', ')).remove();
            const title = $('title').text().trim() || $('h1').first().text().trim() || url;
            // Try to extract from main content area first (much cleaner)
            let content = '';
            const mainSelectors = ['main', 'article', '[role="main"]', '#content', '#main-content', '.main-content', '.page-content'];
            for (const sel of mainSelectors) {
                const mainEl = $(sel);
                if (mainEl.length > 0) {
                    content = mainEl.text().replace(/\s+/g, ' ').trim();
                    if (content.length > 100)
                        break;
                }
            }
            // Fallback to body if main content area not found or too small
            if (content.length < 100) {
                content = $('body').text().replace(/\s+/g, ' ').trim();
            }
            // Post-process: strip common noise patterns
            content = content
                .replace(/Shop Now|Add to Cart|Buy Now|Sign Up|Subscribe|Close|Menu|Skip to content/gi, '')
                .replace(/Get Free Delivery.*?(?=\.|$)/gi, '')
                .replace(/Cookie|Cookies|Accept All|Reject All/gi, '')
                .replace(/\s{2,}/g, ' ')
                .trim();
            if (content.length < 50) {
                console.warn(`⚠️ Content too short (${content.length} chars) for ${url}`);
                return null;
            }
            console.log(`✅ Scraped ${url}: ${content.length} chars, ${content.split(/\s+/).length} words`);
            return { url, title, content, html, word_count: content.split(/\s+/).length };
        }
        catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                console.warn(`⏱️ Timeout scraping ${url}`);
            }
            else {
                console.error(`❌ Error scraping ${url}:`, err.message);
            }
            return null;
        }
    }
    // ================================================================
    // Sarvam AI Integration
    // ================================================================
    /**
     * Summarize a scraped page using Sarvam AI
     */
    async sarvamSummarizePage(sourceId, pageId, content) {
        try {
            const apiKey = process.env.SARVAM_API_KEY;
            if (!apiKey) {
                console.warn('SARVAM_API_KEY not set, skipping summarization');
                return;
            }
            const truncatedContent = content.slice(0, 4000);
            const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'sarvam-m',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a concise content summarizer. Summarize the following webpage content in 2-3 sentences. Focus on what a customer would need to know.'
                        },
                        { role: 'user', content: truncatedContent }
                    ],
                    max_tokens: 200,
                    temperature: 0.3,
                }),
            });
            if (!response.ok) {
                console.warn(`Sarvam summarization failed: ${response.status}`);
                return;
            }
            const data = await response.json();
            const summary = data.choices?.[0]?.message?.content?.trim();
            if (summary) {
                await pool.query('UPDATE website_pages SET summary = $1 WHERE id = $2', [summary, pageId]);
            }
        }
        catch (err) {
            console.warn('Sarvam summarization error:', err.message);
        }
    }
    /**
     * Auto-generate Q&A pairs from scraped content using Sarvam AI
     */
    async sarvamGenerateQnA(sourceId, content, siteName) {
        try {
            const apiKey = process.env.SARVAM_API_KEY;
            if (!apiKey) {
                console.warn('SARVAM_API_KEY not set, skipping Q&A generation');
                return;
            }
            const truncatedContent = content.slice(0, 6000);
            const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'sarvam-m',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a Q&A generator for a customer support chatbot for "${siteName}". Generate 5-10 question-answer pairs from the following website content. These should be common questions a customer might ask. Respond ONLY with a JSON array of objects, each with "question" and "answer" fields. No markdown, no explanation, just the JSON array.`
                        },
                        { role: 'user', content: truncatedContent }
                    ],
                    max_tokens: 2000,
                    temperature: 0.5,
                }),
            });
            if (!response.ok) {
                console.warn(`Sarvam Q&A generation failed: ${response.status}`);
                return;
            }
            const data = await response.json();
            let qnaText = data.choices?.[0]?.message?.content?.trim() || '';
            // Clean up potential markdown code fences
            qnaText = qnaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            let qaPairs;
            try {
                qaPairs = JSON.parse(qnaText);
            }
            catch {
                console.warn('Failed to parse Sarvam Q&A output:', qnaText.slice(0, 200));
                return;
            }
            if (!Array.isArray(qaPairs))
                return;
            // Store each Q&A pair in the database
            for (const qa of qaPairs) {
                if (qa.question && qa.answer) {
                    await pool.query(`INSERT INTO qna_pairs (knowledge_source_id, question, answer, category)
                         VALUES ($1, $2, $3, 'auto-generated')
                         ON CONFLICT DO NOTHING`, [sourceId, qa.question.trim(), qa.answer.trim()]);
                }
            }
            console.log(`🤖 Generated ${qaPairs.length} Q&A pairs for source ${sourceId}`);
        }
        catch (err) {
            console.warn('Sarvam Q&A generation error:', err.message);
        }
    }
    // ================================================================
    // Storage & Embeddings
    // ================================================================
    async savePage(sourceId, pageData, priorityScore = 0) {
        // Truncate title to 500 chars to fit varchar(500) column
        const truncatedTitle = pageData.title.length > 500 ? pageData.title.slice(0, 497) + '...' : pageData.title;
        // Truncate URL to 2048 chars (reasonable max URL length)
        const truncatedUrl = pageData.url.slice(0, 2048);
        const result = await pool.query(`INSERT INTO website_pages (knowledge_source_id, url, title, content, html, word_count, priority_score, last_crawled_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             ON CONFLICT (knowledge_source_id, url)
             DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content,
                           html = EXCLUDED.html, word_count = EXCLUDED.word_count,
                           priority_score = EXCLUDED.priority_score,
                           last_crawled_at = NOW()
             RETURNING *`, [sourceId, truncatedUrl, truncatedTitle, pageData.content, pageData.html, pageData.word_count, priorityScore]);
        return result.rows[0];
    }
    async generatePageEmbeddings(sourceId, pageId, content) {
        const chunks = await splitText(content, 800, 100);
        console.log(`📐 Generating embeddings for ${chunks.length} chunks (source: ${sourceId}, page: ${pageId})`);
        let stored = 0;
        for (const chunk of chunks) {
            try {
                const embedding = await generateEmbedding(chunk);
                const embeddingStr = `[${embedding.join(',')}]`;
                await pool.query(`INSERT INTO knowledge_vectors (source_id, page_id, content_chunk, embedding)
                     VALUES ($1, $2, $3, $4::vector)`, [sourceId, pageId, chunk, embeddingStr]);
                stored++;
            }
            catch (err) {
                if (err.message?.includes('expected') && err.message?.includes('dimensions')) {
                    console.error(`❌ Vector dimension mismatch! Run migration 036_fix_vector_dimensions.sql. Error: ${err.message}`);
                    throw err; // Re-throw dimension errors — they affect ALL chunks
                }
                console.error(`⚠️ Failed to embed chunk (${chunk.slice(0, 50)}...): ${err.message}`);
            }
        }
        console.log(`✅ Stored ${stored}/${chunks.length} embeddings for page ${pageId}`);
    }
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
                if (fullUrl.startsWith(base.origin) && !fullUrl.includes('#') && fullUrl.split('?').length <= 2) {
                    links.push(fullUrl.split('?')[0]);
                }
            }
            catch {
                // Invalid URL, skip
            }
        });
        return [...new Set(links)];
    }
    // ================================================================
    // Job & Status Tracking
    // ================================================================
    async createJob(sourceId) {
        const jobRes = await pool.query(`INSERT INTO processing_jobs (knowledge_source_id, job_type, status, started_at)
             VALUES ($1, 'scrape', 'processing', NOW())
             RETURNING id`, [sourceId]);
        return jobRes.rows[0].id;
    }
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
//# sourceMappingURL=WebsiteScrapingService.js.map