/**
 * DocumentIngestionService — full pipeline: load → chunk → embed → store
 *
 * Handles document text splitting, embedding generation, and pgvector upsert.
 *
 * @example
 * const svc = new DocumentIngestionService();
 * await svc.ingestDocument(kbId, docId, rawText, { chunk_size: 512, chunk_overlap: 50 });
 */
interface ChunkingOptions {
    strategy: 'fixed_size' | 'sentence' | 'paragraph';
    chunk_size: number;
    chunk_overlap: number;
}
interface Chunk {
    text: string;
    index: number;
    char_start: number;
    char_end: number;
    token_count: number;
}
export declare class DocumentIngestionService {
    private embeddingService;
    constructor(embeddingModel?: string, dimensions?: number);
    /**
     * Full ingestion pipeline for a single document
     */
    ingestDocument(kbId: string, docId: string, rawText: string, options?: ChunkingOptions): Promise<{
        chunks_created: number;
        tokens_used: number;
    }>;
    /**
     * Split text into chunks using the specified strategy
     */
    splitText(text: string, options: ChunkingOptions): Chunk[];
    private splitByFixedSize;
    private splitBySentence;
    private splitByParagraph;
}
export {};
//# sourceMappingURL=DocumentIngestionService.d.ts.map