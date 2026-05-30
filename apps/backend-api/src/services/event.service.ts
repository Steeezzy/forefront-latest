import { pool } from '../config/db.js';

export interface EmitEventInput {
  workspace_id: string;
  type: string;
  payload?: Record<string, any>;
}

function assertWorkspaceId(workspaceId?: string) {
  if (!workspaceId) {
    throw new Error('workspace_id is required');
  }
}

export async function emitEvent(input: EmitEventInput) {
  assertWorkspaceId(input.workspace_id);

  const result = await pool.query(
    `INSERT INTO events (workspace_id, type, payload)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [
      input.workspace_id,
      input.type,
      JSON.stringify(input.payload || {}),
    ]
  );

  return result.rows[0];
}
