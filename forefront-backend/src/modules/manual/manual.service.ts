import { pool } from '../../config/db.js';

export class ManualService {
  async createEntry(data: any) {
    const res = await pool.query(
      `INSERT INTO manual_entries (workspace_id, entry_type, data, revenue, source)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.workspaceId,
        data.entryType,
        JSON.stringify(data.data || {}),
        data.revenue || 0,
        data.source || 'manual'
      ]
    );

    // Update workspace totals appropriately based on entryType
    if (data.entryType === 'call') {
      await pool.query(`UPDATE workspaces SET total_calls = total_calls + 1 WHERE id = $1`, [data.workspaceId]);
    } else if (data.entryType === 'appointment') {
      await pool.query(`UPDATE workspaces SET appointments_booked = appointments_booked + 1 WHERE id = $1`, [data.workspaceId]);
    } else if (data.entryType === 'lead') {
      await pool.query(`UPDATE workspaces SET leads_captured = leads_captured + 1 WHERE id = $1`, [data.workspaceId]);
    }
    
    if (data.revenue) {
      await pool.query(`UPDATE workspaces SET revenue_influenced = revenue_influenced + $1 WHERE id = $2`, [data.revenue, data.workspaceId]);
    }

    return res.rows[0];
  }

  async getEntries(workspaceId: string, entryType?: string) {
    let query = `SELECT * FROM manual_entries WHERE workspace_id = $1`;
    const values: any[] = [workspaceId];

    if (entryType) {
      query += ` AND entry_type = $2`;
      values.push(entryType);
    }
    
    query += ` ORDER BY created_at DESC`;

    const res = await pool.query(query, values);
    return res.rows;
  }

  async deleteEntry(entryId: string) {
    // Ideally we would decrement the workspace counts here, but for simplicity skip in MVP
    await pool.query(`DELETE FROM manual_entries WHERE id = $1`, [entryId]);
  }

  async getSummary(workspaceId: string) {
    const res = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(revenue) as total_revenue,
        entry_type
      FROM manual_entries
      WHERE workspace_id = $1
      GROUP BY entry_type
    `, [workspaceId]);

    let total = 0;
    let totalRevenue = 0;
    const byType: Record<string, number> = {};

    res.rows.forEach(row => {
      const cnt = parseInt(row.total);
      total += cnt;
      totalRevenue += parseFloat(row.total_revenue || 0);
      byType[row.entry_type] = cnt;
    });

    return { total, totalRevenue, byType };
  }
}

export const manualService = new ManualService();
