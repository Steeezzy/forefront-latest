import { pool } from '../config/db.js';

export interface CreateAppointmentInput {
  workspace_id: string;
  customer_id?: string | null;
  service: string;
  date: string;
  notes?: string;
  status?: string;
}

function assertWorkspaceId(workspaceId?: string) {
  if (!workspaceId) {
    throw new Error('workspace_id is required');
  }
}

export async function isSlotAvailable(workspaceId: string, date: string) {
  assertWorkspaceId(workspaceId);

  const existing = await pool.query(
    `SELECT id
     FROM appointments
     WHERE workspace_id = $1
       AND date = $2::timestamp
       AND status IN ('scheduled', 'confirmed')
     LIMIT 1`,
    [workspaceId, date]
  );

  return existing.rows.length === 0;
}

export async function createAppointment(data: CreateAppointmentInput) {
  assertWorkspaceId(data.workspace_id);

  const available = await isSlotAvailable(data.workspace_id, data.date);
  if (!available) {
    throw new Error('Selected slot is not available');
  }

  const result = await pool.query(
    `INSERT INTO appointments (
      workspace_id,
      customer_id,
      service,
      date,
      status,
      notes
    ) VALUES ($1, $2, $3, $4::timestamp, $5, $6)
    RETURNING *`,
    [
      data.workspace_id,
      data.customer_id || null,
      data.service,
      data.date,
      data.status || 'scheduled',
      data.notes || null,
    ]
  );

  return result.rows[0];
}
