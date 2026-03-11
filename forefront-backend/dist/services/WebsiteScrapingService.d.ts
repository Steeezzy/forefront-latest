interface ScrapedPage {
    url: string;
    title: string;
    content: string;
    html: string;
    word_count: number;
}
export declare class WebsiteScrapingService {
    private maxDepth;
    private maxPages;
    private priorityMaxPages;
    private timeout;
    /**
     * Add a website as a knowledge source and start scraping
     * @param mode 'priority' — discover & rank priority pages; 'single' — scrape only the provided URL
     */
    addWebsiteSource(agentId: string, url: string, name?: string, mode?: 'priority' | 'single'): Promise<any>;
    private lastScrapeError;
    /**
     * Scrape ONLY the given URL — no crawling.
     */
    scrapeSinglePage(sourceId: string, url: string): Promise<any[]>;
    /**
     * Discover priority pages from the domain and scrape them.
     * Strategy: sitemap.xml → keyword scoring → BFS fallback
     */
    scrapePriorityPages(sourceId: string, startUrl: string): Promise<any[]>;
    /**
     * Fetch and parse /sitemap.xml to discover page URLs
     */
    discoverFromSitemap(origin: string): Promise<string[]>;
    /**
     * Recursively parse sitemaps — handles both sitemap indexes and regular sitemaps.
     * WordPress and many CMS platforms use a sitemap index (sitemapindex) that links
     * to sub-sitemaps containing actual page URLs.
     */
    private parseSitemapRecursive;
    bfsCrawl(startUrl: string, maxDepth: number, maxPages: number): Promise<string[]>;
    /**
     * Score a URL based on keyword matches — higher = more relevant for knowledge base
     */
    scorePriority(url: string, origin: string): number;
    scrapePage(url: string): Promise<ScrapedPage | null>;
    /**
     * Summarize a scraped page using Sarvam AI
     */
    sarvamSummarizePage(sourceId: string, pageId: string, content: string): Promise<void>;
    /**
     * Auto-generate Q&A pairs from scraped content using Sarvam AI
     */
    sarvamGenerateQnA(sourceId: string, content: string, siteName: string): Promise<void>;
    savePage(sourceId: string, pageData: ScrapedPage, priorityScore?: number): Promise<any>;
    generatePageEmbeddings(sourceId: string, pageId: string, content: string): Promise<void>;
    extractLinks(html: string, baseUrl: string): string[];
    createJob(sourceId: string): Promise<string>;
    updateSourceStatus(sourceId: string, status: string, errorMessage?: string): Promise<void>;
    updateJobProgress(jobId: string, processed: number, total: number): Promise<void>;
    completeJob(jobId: string, itemsProcessed: number): Promise<void>;
    failJob(jobId: string, errorMessage: string): Promise<void>;
}
export {};
//# sourceMappingURL=WebsiteScrapingService.d.ts.map