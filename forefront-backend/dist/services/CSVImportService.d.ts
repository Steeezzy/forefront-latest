export declare class CSVImportService {
    private qnaService;
    /**
     * Import Q&A pairs from CSV content (Buffer)
     */
    importFromCSV(agentId: string, csvBuffer: Buffer, name?: string): Promise<{
        source: any;
        total: number;
        imported: number;
    }>;
    /**
     * Simple CSV parser (handles quoted fields)
     */
    private parseCSV;
    /**
     * Parse a single CSV line handling quoted fields
     */
    private parseCSVLine;
    /**
     * Generate a sample CSV template
     */
    generateTemplate(): string;
}
//# sourceMappingURL=CSVImportService.d.ts.map