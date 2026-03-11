export declare class ZendeskService {
    private qnaService;
    /**
     * Import articles from Zendesk Help Center
     */
    importFromZendesk(agentId: string, subdomain: string, email: string, apiToken: string): Promise<{
        source: any;
        total: number;
        imported: number;
    }>;
    /**
     * Fetch all published articles from Zendesk Help Center API
     */
    private fetchAllArticles;
    /**
     * Strip HTML tags from text
     */
    private stripHtml;
}
//# sourceMappingURL=ZendeskService.d.ts.map