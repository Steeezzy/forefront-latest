import { pool } from '../../config/db.js';

export interface Template {
    id: string;
    name: string;
    industry_id: string;
    direction: 'inbound' | 'outbound' | 'webcall';
    mode: 'single' | 'multi';
    icon: string;
    eyebrow?: string;
    summary: string;
    outcome: string;
    first_message: string;
    objective?: string;
    guidelines: string[];
    variables: string[];
    primary_language: string;
    secondary_language?: string;
    voice: string;
    workflow?: any; // MultiPromptWorkflowTemplate
    config_schema: Record<string, any>;
    required_integrations: string[];
    is_active: boolean;
    is_featured: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface Industry {
    id: string;
    label: string;
    description: string;
    icon: string;
    accent_from: string;
    accent_to: string;
    surface: string;
    border: string;
    created_at: Date;
}

export class TemplateService {
    /**
     * List all active templates with optional filters
     */
    async listTemplates(filters?: {
        industry_id?: string;
        direction?: string;
        mode?: string;
        featured?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<Template[]> {
        const conditions: string[] = ['is_active = true'];
        const params: any[] = [];

        if (filters?.industry_id) {
            conditions.push('industry_id = $' + (params.length + 1));
            params.push(filters.industry_id);
        }
        if (filters?.direction) {
            conditions.push('direction = $' + (params.length + 1));
            params.push(filters.direction);
        }
        if (filters?.mode) {
            conditions.push('mode = $' + (params.length + 1));
            params.push(filters.mode);
        }
        if (filters?.featured !== undefined) {
            conditions.push('is_featured = $' + (params.length + 1));
            params.push(filters.featured);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limitClause = filters?.limit ? `LIMIT $${params.length + 1}` : '';
        const offsetClause = filters?.offset ? `OFFSET $${params.length + (filters.limit ? 1 : 0) + 1}` : '';

        const query = `
            SELECT * FROM templates
            ${whereClause}
            ORDER BY is_featured DESC, created_at DESC
            ${limitClause} ${offsetClause}
        `;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Get a single template by ID
     */
    async getTemplate(id: string): Promise<Template | null> {
        const result = await pool.query(
            'SELECT * FROM templates WHERE id = $1 AND is_active = true',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Get all industries
     */
    async getIndustries(): Promise<Industry[]> {
        const result = await pool.query(
            'SELECT * FROM industries ORDER BY label ASC'
        );
        return result.rows;
    }

    /**
     * Get templates by industry slug
     */
    async getTemplatesByIndustry(industryId: string): Promise<Template[]> {
        return this.listTemplates({ industry_id: industryId });
    }

    /**
     * Get featured templates (for homepage/spotlight)
     */
    async getFeaturedTemplates(limit: number = 6): Promise<Template[]> {
        return this.listTemplates({ featured: true, limit });
    }

    /**
     * Admin: Create a new template
     */
    async createTemplate(data: Partial<Template>): Promise<Template> {
        const result = await pool.query(
            `INSERT INTO templates (
                name, industry_id, direction, mode, icon, eyebrow, summary, outcome,
                first_message, objective, guidelines, variables, primary_language,
                secondary_language, voice, workflow, config_schema, required_integrations,
                is_active, is_featured
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING *`,
            [
                data.name,
                data.industry_id,
                data.direction,
                data.mode || 'single',
                data.icon,
                data.eyebrow || null,
                data.summary,
                data.outcome,
                data.first_message,
                data.objective || null,
                data.guidelines || [],
                data.variables || [],
                data.primary_language || 'en-IN',
                data.secondary_language || null,
                data.voice || 'sarvam-tanya',
                data.workflow || null,
                data.config_schema || {},
                data.required_integrations || [],
                data.is_active !== undefined ? data.is_active : true,
                data.is_featured || false
            ]
        );
        return result.rows[0];
    }

    /**
     * Admin: Update a template
     */
    async updateTemplate(id: string, data: Partial<Template>): Promise<Template | null> {
        const fields: string[] = [];
        const params: any[] = [];
        let paramCount = 0;

        const allowedFields = [
            'name', 'industry_id', 'direction', 'mode', 'icon', 'eyebrow',
            'summary', 'outcome', 'first_message', 'objective', 'guidelines',
            'variables', 'primary_language', 'secondary_language', 'voice',
            'workflow', 'config_schema', 'required_integrations', 'is_active', 'is_featured'
        ];

        for (const field of allowedFields) {
            if (data[field as keyof Template] !== undefined) {
                paramCount++;
                fields.push(`${field} = $${paramCount}`);
                params.push(data[field as keyof Template]);
            }
        }

        if (fields.length === 0) {
            return this.getTemplate(id);
        }

        paramCount++;
        params.push(new Date().toISOString(), id);
        fields.push(`updated_at = $${paramCount-1}`);

        const query = `UPDATE templates SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const result = await pool.query(query, params);
        return result.rows[0] || null;
    }

    /**
     * Admin: Delete a template (soft delete via is_active)
     */
    async deleteTemplate(id: string): Promise<boolean> {
        const result = await pool.query(
            'UPDATE templates SET is_active = false WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows.length > 0;
    }

    /**
     * Seed default templates from hardcoded data
     * This should be run once to populate the database
     */
    async seedTemplatesFromData(templates: any[]): Promise<number> {
        let count = 0;
        for (const tpl of templates) {
            const exists = await pool.query('SELECT id FROM templates WHERE name = $1', [tpl.name]);
            if (exists.rows.length === 0) {
                await this.createTemplate(tpl);
                count++;
            }
        }
        return count;
    }
}

export const templateService = new TemplateService();
