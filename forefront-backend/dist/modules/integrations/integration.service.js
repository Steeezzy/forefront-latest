/**
 * IntegrationService — Core CRUD & lifecycle for all integrations
 */
import { pool } from '../../config/db.js';
export class IntegrationService {
    /**
     * Get all integrations for a workspace
     */
    async getAll(workspaceId) {
        const result = await pool.query(`SELECT id, workspace_id, integration_type, status, is_active,
              display_name, config, metadata, webhook_url, connected_at,
              last_synced_at, error_message, created_at, updated_at
       FROM integrations
       WHERE workspace_id = $1
       ORDER BY integration_type`, [workspaceId]);
        // Never return credentials to clients
        return result.rows;
    }
    /**
     * Get a specific integration
     */
    async get(workspaceId, type) {
        const result = await pool.query(`SELECT * FROM integrations WHERE workspace_id = $1 AND integration_type = $2`, [workspaceId, type]);
        return result.rows[0] || null;
    }
    /**
     * Connect (upsert) an integration
     */
    async connect(workspaceId, type, data) {
        const result = await pool.query(`INSERT INTO integrations (workspace_id, integration_type, status, is_active, display_name,
                                  config, credentials, metadata, webhook_url, webhook_secret, connected_at)
       VALUES ($1, $2, 'connected', true, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (workspace_id, integration_type)
       DO UPDATE SET status = 'connected', is_active = true,
                     display_name = COALESCE(EXCLUDED.display_name, integrations.display_name),
                     config = integrations.config || EXCLUDED.config,
                     credentials = integrations.credentials || EXCLUDED.credentials,
                     metadata = integrations.metadata || EXCLUDED.metadata,
                     webhook_url = COALESCE(EXCLUDED.webhook_url, integrations.webhook_url),
                     webhook_secret = COALESCE(EXCLUDED.webhook_secret, integrations.webhook_secret),
                     connected_at = COALESCE(integrations.connected_at, NOW()),
                     error_message = NULL,
                     updated_at = NOW()
       RETURNING *`, [
            workspaceId, type,
            data.displayName || null,
            JSON.stringify(data.config || {}),
            JSON.stringify(data.credentials || {}),
            JSON.stringify(data.metadata || {}),
            data.webhookUrl || null,
            data.webhookSecret || null
        ]);
        return result.rows[0];
    }
    /**
     * Disconnect an integration
     */
    async disconnect(workspaceId, type) {
        await pool.query(`UPDATE integrations
       SET status = 'disconnected', is_active = false, credentials = '{}', error_message = NULL, updated_at = NOW()
       WHERE workspace_id = $1 AND integration_type = $2`, [workspaceId, type]);
    }
    /**
     * Update config or metadata
     */
    async updateConfig(workspaceId, type, config) {
        const result = await pool.query(`UPDATE integrations
       SET config = config || $3, updated_at = NOW()
       WHERE workspace_id = $1 AND integration_type = $2
       RETURNING *`, [workspaceId, type, JSON.stringify(config)]);
        return result.rows[0] || null;
    }
    /**
     * Mark sync completed
     */
    async markSynced(workspaceId, type) {
        await pool.query(`UPDATE integrations SET last_synced_at = NOW(), updated_at = NOW()
       WHERE workspace_id = $1 AND integration_type = $2`, [workspaceId, type]);
    }
    /**
     * Mark integration error
     */
    async markError(workspaceId, type, errorMessage) {
        await pool.query(`UPDATE integrations SET status = 'error', error_message = $3, updated_at = NOW()
       WHERE workspace_id = $1 AND integration_type = $2`, [workspaceId, type, errorMessage]);
    }
    // ================================================================
    // Sync Logs
    // ================================================================
    async createSyncLog(integrationId, syncType, direction = 'outbound') {
        const result = await pool.query(`INSERT INTO integration_sync_logs (integration_id, sync_type, direction, status)
       VALUES ($1, $2, $3, 'processing') RETURNING id`, [integrationId, syncType, direction]);
        return result.rows[0].id;
    }
    async completeSyncLog(logId, recordsProcessed, recordsFailed = 0) {
        await pool.query(`UPDATE integration_sync_logs
       SET status = 'completed', records_processed = $2, records_failed = $3, completed_at = NOW()
       WHERE id = $1`, [logId, recordsProcessed, recordsFailed]);
    }
    async failSyncLog(logId, error) {
        await pool.query(`UPDATE integration_sync_logs
       SET status = 'failed', error_message = $2, completed_at = NOW()
       WHERE id = $1`, [logId, error]);
    }
    // ================================================================
    // Webhook Events
    // ================================================================
    async logWebhookEvent(integrationId, integrationType, workspaceId, eventType, payload) {
        await pool.query(`INSERT INTO integration_webhook_events (integration_id, integration_type, workspace_id, event_type, payload)
       VALUES ($1, $2, $3, $4, $5)`, [integrationId, integrationType, workspaceId, eventType, JSON.stringify(payload)]);
    }
}
//# sourceMappingURL=integration.service.js.map