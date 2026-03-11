/**
 * FieldMappingService — CRUD for configurable field mappings
 *
 * Lets users map Forefront contact fields to CRM / marketing platform fields.
 * Each integration type has sensible defaults that get created on first connect.
 */
import { pool } from '../../config/db.js';
// ─── Available source fields (from Forefront contacts/conversations) ──
export const SOURCE_FIELDS = [
    { key: 'visitor_email', label: 'Email', type: 'string' },
    { key: 'visitor_name', label: 'Full Name', type: 'string' },
    { key: 'first_name', label: 'First Name', type: 'string' },
    { key: 'last_name', label: 'Last Name', type: 'string' },
    { key: 'visitor_phone', label: 'Phone', type: 'string' },
    { key: 'company', label: 'Company', type: 'string' },
    { key: 'channel', label: 'Channel', type: 'string' },
    { key: 'tags', label: 'Tags', type: 'array' },
    { key: 'city', label: 'City', type: 'string' },
    { key: 'country', label: 'Country', type: 'string' },
    { key: 'browser', label: 'Browser', type: 'string' },
    { key: 'os', label: 'Operating System', type: 'string' },
    { key: 'landing_page', label: 'Landing Page URL', type: 'string' },
    { key: 'referrer', label: 'Referrer URL', type: 'string' },
    { key: 'conversation_count', label: 'Conversation Count', type: 'number' },
    { key: 'last_seen_at', label: 'Last Seen', type: 'datetime' },
    { key: 'created_at', label: 'First Seen', type: 'datetime' },
];
// ─── Default target fields per CRM ──────────────────────────────────
const DEFAULT_MAPPINGS = {
    hubspot: [
        { source_field: 'visitor_email', target_field: 'email', target_field_label: 'Email', is_required: true },
        { source_field: 'first_name', target_field: 'firstname', target_field_label: 'First Name' },
        { source_field: 'last_name', target_field: 'lastname', target_field_label: 'Last Name' },
        { source_field: 'visitor_phone', target_field: 'phone', target_field_label: 'Phone' },
        { source_field: 'company', target_field: 'company', target_field_label: 'Company' },
        { source_field: 'channel', target_field: 'hs_lead_status', target_field_label: 'Lead Status', transform: 'uppercase' },
    ],
    salesforce: [
        { source_field: 'visitor_email', target_field: 'Email', target_field_label: 'Email', is_required: true },
        { source_field: 'first_name', target_field: 'FirstName', target_field_label: 'First Name' },
        { source_field: 'last_name', target_field: 'LastName', target_field_label: 'Last Name' },
        { source_field: 'visitor_phone', target_field: 'Phone', target_field_label: 'Phone' },
        { source_field: 'company', target_field: 'Company', target_field_label: 'Company' },
    ],
    pipedrive: [
        { source_field: 'visitor_email', target_field: 'email', target_field_label: 'Email', is_required: true },
        { source_field: 'visitor_name', target_field: 'name', target_field_label: 'Name' },
        { source_field: 'visitor_phone', target_field: 'phone', target_field_label: 'Phone' },
    ],
    zoho: [
        { source_field: 'visitor_email', target_field: 'Email', target_field_label: 'Email', is_required: true },
        { source_field: 'first_name', target_field: 'First_Name', target_field_label: 'First Name' },
        { source_field: 'last_name', target_field: 'Last_Name', target_field_label: 'Last Name' },
        { source_field: 'visitor_phone', target_field: 'Phone', target_field_label: 'Phone' },
    ],
    agile_crm: [
        { source_field: 'visitor_email', target_field: 'email', target_field_label: 'Email', is_required: true },
        { source_field: 'first_name', target_field: 'first_name', target_field_label: 'First Name' },
        { source_field: 'last_name', target_field: 'last_name', target_field_label: 'Last Name' },
        { source_field: 'company', target_field: 'company', target_field_label: 'Company' },
    ],
    zendesk_sell: [
        { source_field: 'visitor_email', target_field: 'email', target_field_label: 'Email', is_required: true },
        { source_field: 'first_name', target_field: 'first_name', target_field_label: 'First Name' },
        { source_field: 'last_name', target_field: 'last_name', target_field_label: 'Last Name' },
        { source_field: 'visitor_phone', target_field: 'phone', target_field_label: 'Phone' },
        { source_field: 'company', target_field: 'organization_name', target_field_label: 'Organization' },
    ],
    mailchimp: [
        { source_field: 'visitor_email', target_field: 'email_address', target_field_label: 'Email', is_required: true },
        { source_field: 'first_name', target_field: 'FNAME', target_field_label: 'First Name' },
        { source_field: 'last_name', target_field: 'LNAME', target_field_label: 'Last Name' },
    ],
    klaviyo: [
        { source_field: 'visitor_email', target_field: '$email', target_field_label: 'Email', is_required: true },
        { source_field: 'first_name', target_field: '$first_name', target_field_label: 'First Name' },
        { source_field: 'last_name', target_field: '$last_name', target_field_label: 'Last Name' },
        { source_field: 'visitor_phone', target_field: '$phone_number', target_field_label: 'Phone' },
    ],
};
// ─── Service ─────────────────────────────────────────────────────────
export class FieldMappingService {
    /**
     * Get all mappings for a workspace + integration type.
     * If none exist yet, seeds the defaults and returns those.
     */
    async getMappings(workspaceId, integrationType) {
        const { rows } = await pool.query(`SELECT * FROM integration_field_mappings
       WHERE workspace_id = $1 AND integration_type = $2
       ORDER BY is_required DESC, source_field`, [workspaceId, integrationType]);
        if (rows.length === 0) {
            // Seed defaults
            await this.seedDefaults(workspaceId, integrationType);
            const seeded = await pool.query(`SELECT * FROM integration_field_mappings
         WHERE workspace_id = $1 AND integration_type = $2
         ORDER BY is_required DESC, source_field`, [workspaceId, integrationType]);
            return seeded.rows;
        }
        return rows;
    }
    /**
     * Save (upsert) a full set of mappings for a workspace + integration.
     * Replaces all non-required mappings with the incoming set.
     */
    async saveMappings(workspaceId, integrationType, mappings) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Delete existing non-required mappings
            await client.query(`DELETE FROM integration_field_mappings
         WHERE workspace_id = $1 AND integration_type = $2 AND is_required = false`, [workspaceId, integrationType]);
            // Upsert all mappings
            for (const m of mappings) {
                await client.query(`INSERT INTO integration_field_mappings
           (workspace_id, integration_type, source_field, target_field, target_field_label,
            is_required, is_default, transform, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, false, $7, NOW())
           ON CONFLICT (workspace_id, integration_type, source_field)
           DO UPDATE SET target_field = $4, target_field_label = $5,
                         is_required = $6, transform = $7, updated_at = NOW()`, [
                    workspaceId, integrationType,
                    m.source_field, m.target_field,
                    m.target_field_label || m.target_field,
                    m.is_required || false,
                    m.transform || 'none',
                ]);
            }
            await client.query('COMMIT');
            return this.getMappings(workspaceId, integrationType);
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    /**
     * Delete a single mapping
     */
    async deleteMapping(workspaceId, mappingId) {
        await pool.query(`DELETE FROM integration_field_mappings
       WHERE id = $1 AND workspace_id = $2 AND is_required = false`, [mappingId, workspaceId]);
    }
    /**
     * Reset to default mappings
     */
    async resetToDefaults(workspaceId, integrationType) {
        await pool.query(`DELETE FROM integration_field_mappings
       WHERE workspace_id = $1 AND integration_type = $2`, [workspaceId, integrationType]);
        return this.getMappings(workspaceId, integrationType);
    }
    /**
     * Apply mappings to transform a Forefront contact into CRM-ready data.
     * Used by CrmSyncManager.syncContact() before sending to CRM.
     */
    async applyMappings(workspaceId, integrationType, sourceData) {
        const mappings = await this.getMappings(workspaceId, integrationType);
        const result = {};
        for (const mapping of mappings) {
            let value = sourceData[mapping.source_field];
            if (value === undefined || value === null || value === '')
                continue;
            // Apply transform
            switch (mapping.transform) {
                case 'lowercase':
                    value = String(value).toLowerCase();
                    break;
                case 'uppercase':
                    value = String(value).toUpperCase();
                    break;
                case 'split_first':
                    value = String(value).split(' ')[0] || '';
                    break;
                case 'split_last':
                    value = String(value).split(' ').slice(1).join(' ') || '';
                    break;
                case 'join_comma':
                    value = Array.isArray(value) ? value.join(', ') : String(value);
                    break;
            }
            result[mapping.target_field] = value;
        }
        return result;
    }
    /**
     * Get available source fields
     */
    getSourceFields() {
        return SOURCE_FIELDS;
    }
    /**
     * Get default target fields for a given integration type
     */
    getDefaultTargetFields(integrationType) {
        return DEFAULT_MAPPINGS[integrationType] || [];
    }
    // ─── Private ──────────────────────────────────────────────────────
    async seedDefaults(workspaceId, integrationType) {
        const defaults = DEFAULT_MAPPINGS[integrationType];
        if (!defaults)
            return;
        for (const m of defaults) {
            await pool.query(`INSERT INTO integration_field_mappings
         (workspace_id, integration_type, source_field, target_field, target_field_label,
          is_required, is_default, transform)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)
         ON CONFLICT DO NOTHING`, [
                workspaceId, integrationType,
                m.source_field, m.target_field,
                m.target_field_label || m.target_field,
                m.is_required || false,
                m.transform || 'none',
            ]);
        }
    }
}
//# sourceMappingURL=field-mapping.service.js.map