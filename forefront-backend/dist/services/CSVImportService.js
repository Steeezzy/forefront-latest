import { pool } from '../config/db.js';
import { ManualQnAService } from './ManualQnAService.js';
export class CSVImportService {
    constructor() {
        this.qnaService = new ManualQnAService();
    }
    /**
     * Import Q&A pairs from CSV content (Buffer)
     */
    async importFromCSV(agentId, csvBuffer, name = 'CSV Import') {
        // 1. Create knowledge source
        const sourceRes = await pool.query(`INSERT INTO knowledge_sources (agent_id, type, content, name, status)
             VALUES ($1, 'csv_import', 'CSV Import', $2, 'processing')
             RETURNING *`, [agentId, name]);
        const source = sourceRes.rows[0];
        // 2. Create processing job
        const jobRes = await pool.query(`INSERT INTO processing_jobs (knowledge_source_id, job_type, status, started_at)
             VALUES ($1, 'import', 'processing', NOW())
             RETURNING id`, [source.id]);
        const jobId = jobRes.rows[0].id;
        try {
            // 3. Parse CSV manually (simple parser, no external dep needed for basic CSV)
            const csvText = csvBuffer.toString('utf-8');
            const rows = this.parseCSV(csvText);
            const totalRows = rows.length;
            let processedRows = 0;
            // Update total
            await pool.query(`UPDATE processing_jobs SET total_items = $2 WHERE id = $1`, [jobId, totalRows]);
            // 4. Process each row
            for (const row of rows) {
                try {
                    const question = row.question || row.Question;
                    const answer = row.answer || row.Answer;
                    const category = row.category || row.Category || null;
                    if (question && answer) {
                        await this.qnaService.addQnAPair(source.id, question.trim(), answer.trim(), category?.trim() || null);
                    }
                    processedRows++;
                    const progress = Math.round((processedRows / totalRows) * 100);
                    await pool.query(`UPDATE processing_jobs SET processed_items = $2, progress = $3 WHERE id = $1`, [jobId, processedRows, progress]);
                }
                catch (err) {
                    console.error('Error processing CSV row:', err.message);
                }
            }
            // 5. Mark completed
            await pool.query(`UPDATE knowledge_sources SET status = 'completed', last_synced_at = NOW() WHERE id = $1`, [source.id]);
            await pool.query(`UPDATE processing_jobs SET status = 'completed', progress = 100, completed_at = NOW() WHERE id = $1`, [jobId]);
            return { source, total: totalRows, imported: processedRows };
        }
        catch (error) {
            await pool.query(`UPDATE knowledge_sources SET status = 'failed', error_message = $2 WHERE id = $1`, [source.id, error.message]);
            await pool.query(`UPDATE processing_jobs SET status = 'failed', error_message = $2, completed_at = NOW() WHERE id = $1`, [jobId, error.message]);
            throw error;
        }
    }
    /**
     * Simple CSV parser (handles quoted fields)
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2)
            return [];
        // Parse header
        const headers = this.parseCSVLine(lines[0]);
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim() || '';
            });
            rows.push(row);
        }
        return rows;
    }
    /**
     * Parse a single CSV line handling quoted fields
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip escaped quote
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
    /**
     * Generate a sample CSV template
     */
    generateTemplate() {
        return `question,answer,category
"What are your business hours?","We are open Monday to Friday, 9 AM to 6 PM IST.","General"
"How can I track my order?","You can track your order using the tracking number sent to your email.","Orders"
"What is your return policy?","We accept returns within 30 days of purchase with original packaging.","Returns"`;
    }
}
