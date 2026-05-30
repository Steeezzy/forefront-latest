import { pool } from '../../config/db.js';
import crypto from 'crypto';

export interface Mailbox {
  id: string;
  workspace_id: string;
  email: string;
  local_part: string;
  domain: string;
  display_name: string;
  storage_limit_gb: number;
  storage_used_mb: number;
  status: string;
  created_at: string;
}

export class MailboxService {
  async listMailboxes(workspaceId: string): Promise<Mailbox[]> {
    const { rows } = await pool.query(
      `SELECT * FROM mailboxes WHERE workspace_id = $1 ORDER BY created_at DESC`,
      [workspaceId]
    );
    return rows;
  }

  async createMailbox(workspaceId: string, data: {
    localPart: string;
    domain: string;
    displayName: string;
    password: string;
    storageLimitGb: number;
  }): Promise<Mailbox> {
    const email = `${data.localPart}@${data.domain}`;
    const passwordHash = crypto.createHash('sha256').update(data.password).digest('hex');

    const { rows } = await pool.query(
      `INSERT INTO mailboxes (workspace_id, email, local_part, domain, display_name, password_hash, storage_limit_gb)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET display_name = $5, updated_at = NOW()
       RETURNING *`,
      [workspaceId, email, data.localPart, data.domain, data.displayName, passwordHash, data.storageLimitGb]
    );
    return rows[0];
  }

  async deleteMailbox(workspaceId: string, mailboxId: string): Promise<void> {
    await pool.query(
      `DELETE FROM mailboxes WHERE id = $1 AND workspace_id = $2`,
      [mailboxId, workspaceId]
    );
  }

  async getMailboxById(workspaceId: string, mailboxId: string): Promise<Mailbox | null> {
    const { rows } = await pool.query(
      `SELECT * FROM mailboxes WHERE id = $1 AND workspace_id = $2`,
      [mailboxId, workspaceId]
    );
    return rows[0] ?? null;
  }

  async getStorageStats(workspaceId: string): Promise<{
    totalMailboxes: number;
    totalStorageUsedMb: number;
    totalStorageLimitGb: number;
  }> {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) AS total_mailboxes,
         COALESCE(SUM(storage_used_mb), 0) AS total_storage_used_mb,
         COALESCE(SUM(storage_limit_gb), 0) AS total_storage_limit_gb
       FROM mailboxes
       WHERE workspace_id = $1`,
      [workspaceId]
    );
    return {
      totalMailboxes: parseInt(rows[0].total_mailboxes),
      totalStorageUsedMb: parseFloat(rows[0].total_storage_used_mb),
      totalStorageLimitGb: parseFloat(rows[0].total_storage_limit_gb),
    };
  }
}
