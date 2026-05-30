/**
 * CrmAutomationService — Orchestrates automatic contact syncing
 * between Questron conversations and connected CRM providers.
 */
import { pool } from '../../config/db.js';
import { CrmSyncManager, CrmContact } from '../../modules/integrations/providers/crm.provider.js';

export class CrmAutomationService {
  private crmSyncManager = new CrmSyncManager();

  /**
   * Automatically syncs a contact to the workspace's connected CRM.
   * This should be called after a visitor is identified in a channel.
   */
  async autoSyncContact(workspaceId: string, contact: CrmContact): Promise<{ success: boolean; provider?: string; error?: string }> {
    try {
      // 1. Find the active CRM integration for this workspace
      const result = await pool.query(
        `SELECT id, integration_type, credentials
         FROM integrations
         WHERE workspace_id = $1
           AND integration_type IN ('hubspot', 'salesforce', 'pipedrive', 'zoho', 'agile_crm', 'zendesk_sell')
           AND status = 'connected'
           AND is_active = true
         LIMIT 1`,
        [workspaceId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'No connected CRM found for this workspace' };
      }

      const integration = result.rows[0];
      const integrationId = integration.id;
      const integrationType = integration.integration_type;
      const credentials = integration.credentials;

      // 2. Use CrmSyncManager to push the contact
      const syncResult = await this.crmSyncManager.syncContact(
        integrationId,
        workspaceId,
        integrationType,
        credentials,
        contact
      );

      if (syncResult.success) {
        return {
          success: true,
          provider: integrationType
        };
      } else {
        return {
          success: false,
          provider: integrationType,
          error: syncResult.error
        };
      }
    } catch (error: any) {
      console.error(`[CrmAutomation] Auto-sync failed for workspace ${workspaceId}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

export const crmAutomationService = new CrmAutomationService();
