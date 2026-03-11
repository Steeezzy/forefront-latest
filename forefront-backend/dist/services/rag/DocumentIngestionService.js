/**
 * DocumentIngestionService — full pipeline: load → chunk → embed → store
 *
 * Handles document text splitting, embedding generation, and pgvector upsert.
 *
 * @example
 * const svc = new DocumentIngestionService();
 * await svc.ingestDocument(kbId, docId, rawText, { chunk_size: 512, chunk_overlap: 50 });
 */
import { pool } from '../../config/db.js';
import { EmbeddingService } from './EmbeddingService.js';
export class DocumentIngestionService {
    embeddingService;
    constructor(embeddingModel, dimensions) {
        this.embeddingService = new EmbeddingService(embeddingModel, dimensions);
    }
    /**
     * Full ingestion pipeline for a single document
     */
    async ingestDocument(kbId, docId, rawText, options = { strategy: 'fixed_size', chunk_size: 512, chunk_overlap: 50 }) {
        // 1. Update doc status to processing
        await pool.query(`UPDATE kb_documents SET status = 'processing', raw_text = $1, char_count = $2, token_count = $3 WHERE id = $4`, [rawText, rawText.length, this.embeddingService.estimateTokens(rawText), docId]);
        try {
            // 2. Split into chunks
            const chunks = this.splitText(rawText, options);
            // 3. Generate embeddings in batches
            const chunkTexts = chunks.map(c => c.text);
            const embeddings = await this.embeddingService.embedBatch(chunkTexts);
            // 4. Upsert into pgvector
            let totalTokens = 0;
            const BATCH_SIZE = 50;
            for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
                const batchChunks = chunks.slice(i, i + BATCH_SIZE);
                const batchEmbeddings = embeddings.slice(i, i + BATCH_SIZE);
                const values = [];
                const placeholders = [];
                batchChunks.forEach((chunk, j) => {
                    const offset = j * 9;
                    placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`);
                    values.push(kbId, docId, chunk.text, `[${batchEmbeddings[j].embedding.join(',')}]`, chunk.index, chunk.char_start, chunk.char_end, chunk.token_count);
                    // metadata as empty JSON
                    values.push('{}');
                    totalTokens += batchEmbeddings[j].tokens_used;
                });
                await pool.query(`INSERT INTO document_chunks (kb_id, document_id, chunk_text, embedding, chunk_index, char_start, char_end, token_count, metadata)
                     VALUES ${placeholders.join(', ')}`, values);
            }
            // 5. Update document status
            await pool.query(`UPDATE kb_documents SET status = 'indexed', chunk_count = $1 WHERE id = $2`, [chunks.length, docId]);
            // 6. Update KB counts
            await pool.query(`UPDATE knowledge_bases SET
                    doc_count = (SELECT COUNT(*) FROM kb_documents WHERE kb_id = $1 AND status = 'indexed'),
                    chunk_count = (SELECT COUNT(*) FROM document_chunks WHERE kb_id = $1)
                 WHERE id = $1`, [kbId]);
            return { chunks_created: chunks.length, tokens_used: totalTokens };
        }
        catch (error) {
            await pool.query(`UPDATE kb_documents SET status = 'error', error_message = $1 WHERE id = $2`, [error.message, docId]);
            throw error;
        }
    }
    /**
     * Split text into chunks using the specified strategy
     */
    splitText(text, options) {
        switch (options.strategy) {
            case 'sentence':
                return this.splitBySentence(text, options.chunk_size, options.chunk_overlap);
            case 'paragraph':
                return this.splitByParagraph(text, options.chunk_size);
            case 'fixed_size':
            default:
                return this.splitByFixedSize(text, options.chunk_size, options.chunk_overlap);
        }
    }
    splitByFixedSize(text, chunkSize, overlap) {
        const charSize = chunkSize * 4; // approximate: 1 token ≈ 4 chars
        const charOverlap = overlap * 4;
        const chunks = [];
        let pos = 0;
        let index = 0;
        while (pos < text.length) {
            const end = Math.min(pos + charSize, text.length);
            const chunkText = text.slice(pos, end).trim();
            if (chunkText.length > 0) {
                chunks.push({
                    text: chunkText,
                    index,
                    char_start: pos,
                    char_end: end,
                    token_count: this.embeddingService.estimateTokens(chunkText),
                });
                index++;
            }
            pos += charSize - charOverlap;
        }
        return chunks;
    }
    splitBySentence(text, maxTokens, overlapTokens) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const chunks = [];
        let currentChunk = '';
        let charStart = 0;
        let index = 0;
        for (const sentence of sentences) {
            const combined = currentChunk + sentence;
            if (this.embeddingService.estimateTokens(combined) > maxTokens && currentChunk) {
                chunks.push({
                    text: currentChunk.trim(),
                    index,
                    char_start: charStart,
                    char_end: charStart + currentChunk.length,
                    token_count: this.embeddingService.estimateTokens(currentChunk),
                });
                index++;
                // Overlap: keep last N tokens worth of text
                const overlapChars = overlapTokens * 4;
                currentChunk = currentChunk.slice(-overlapChars) + sentence;
                charStart = charStart + currentChunk.length - overlapChars;
            }
            else {
                currentChunk = combined;
            }
        }
        if (currentChunk.trim()) {
            chunks.push({
                text: currentChunk.trim(),
                index,
                char_start: charStart,
                char_end: charStart + currentChunk.length,
                token_count: this.embeddingService.estimateTokens(currentChunk),
            });
        }
        return chunks;
    }
    splitByParagraph(text, maxTokens) {
        const paragraphs = text.split(/\n\s*\n/);
        const chunks = [];
        let currentChunk = '';
        let charStart = 0;
        let index = 0;
        for (const para of paragraphs) {
            const combined = currentChunk + '\n\n' + para;
            if (this.embeddingService.estimateTokens(combined) > maxTokens && currentChunk) {
                chunks.push({
                    text: currentChunk.trim(),
                    index,
                    char_start: charStart,
                    char_end: charStart + currentChunk.length,
                    token_count: this.embeddingService.estimateTokens(currentChunk),
                });
                index++;
                currentChunk = para;
                charStart += currentChunk.length;
            }
            else {
                currentChunk = combined;
            }
        }
        if (currentChunk.trim()) {
            chunks.push({
                text: currentChunk.trim(),
                index,
                char_start: charStart,
                char_end: charStart + currentChunk.length,
                token_count: this.embeddingService.estimateTokens(currentChunk),
            });
        }
        return chunks;
    }
}
//# sourceMappingURL=DocumentIngestionService.js.map