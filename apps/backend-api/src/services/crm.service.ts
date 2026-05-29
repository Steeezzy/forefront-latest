import { pool } from '../config/db.js';

export interface CreateCustomerInput {
  workspace_id: string;
  name?: string;
  phone?: string;
  email?: string;
  tags?: string[];
  lead_score?: number;
  lifecycle_stage?: string;
}

export interface LogInteractionInput {
  workspace_id: string;
  customer_id?: string | null;
  channel: string;
  message?: string;
  response?: string;
  intent?: string;
  metadata?: Record<string, any>;
}

function assertWorkspaceId(workspaceId?: string) {
  if (!workspaceId) {
    throw new Error('workspace_id is required');
  }
}

export async function createCustomer(data: CreateCustomerInput) {
  assertWorkspaceId(data.workspace_id);

  const result = await pool.query(
    `INSERT INTO customers (
      workspace_id,
      name,
      phone,
      email,
      tags,
      lead_score,
      lifecycle_stage
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      data.workspace_id,
      data.name || null,
      data.phone || null,
      data.email || null,
      data.tags || [],
      data.lead_score ?? 0,
      data.lifecycle_stage || 'new',
    ]
  );

  return result.rows[0];
}

export async function getCustomerByPhone(phone: string, workspaceId: string) {
  assertWorkspaceId(workspaceId);

  const result = await pool.query(
    `SELECT *
     FROM customers
     WHERE phone = $1 AND workspace_id = $2
     LIMIT 1`,
    [phone, workspaceId]
  );

  return result.rows[0] || null;
}

export async function logInteraction(data: LogInteractionInput) {
  assertWorkspaceId(data.workspace_id);

  const result = await pool.query(
    `INSERT INTO interactions (
      workspace_id,
      customer_id,
      channel,
      message,
      response,
      intent,
      metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      data.workspace_id,
      data.customer_id || null,
      data.channel,
      data.message || null,
      data.response || null,
      data.intent || null,
      JSON.stringify(data.metadata || {}),
    ]
  );

  return result.rows[0];
}
