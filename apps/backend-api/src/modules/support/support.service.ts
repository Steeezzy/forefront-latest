import crypto from 'crypto';
import { pool } from '../../config/db.js';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  workspace_id: string;
  customer_name: string;
  customer_email: string;
  title: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  channel: string;
  assigned_to: string | null;
  messages: TicketMessage[];
  internal_notes: InternalNote[];
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  sender: 'customer' | 'agent';
  content: string;
  created_at: string;
  agent_name?: string;
}

export interface InternalNote {
  id: string;
  agent_name: string;
  content: string;
  created_at: string;
}

export interface OnboardingFlow {
  id: string;
  name: string;
  auto_trigger: boolean;
  steps: OnboardingStep[];
  created_at: string;
  updated_at: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'required' | 'optional';
  link: string | null;
  order: number;
  auto_complete?: string;
}

export class SupportService {
  async listTickets(filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
  }): Promise<SupportTicket[]> {
    let query = `SELECT * FROM support_tickets WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (filters?.status && filters.status !== 'all') {
      query += ` AND status = $${idx++}`;
      params.push(filters.status);
    }
    if (filters?.priority && filters.priority !== 'all') {
      query += ` AND priority = $${idx++}`;
      params.push(filters.priority);
    }
    if (filters?.assignedTo) {
      query += ` AND assigned_to = $${idx++}`;
      params.push(filters.assignedTo);
    }
    if (filters?.search) {
      query += ` AND (title ILIKE $${idx} OR customer_name ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    query += ` ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, created_at DESC`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    const { rows } = await pool.query(
      `SELECT * FROM support_tickets WHERE id = $1`,
      [ticketId]
    );
    return rows[0] || null;
  }

  async addMessage(
    ticketId: string,
    sender: 'customer' | 'agent',
    content: string,
    agentName?: string
  ): Promise<void> {
    const message: TicketMessage = {
      id: crypto.randomUUID(),
      sender,
      content,
      agent_name: agentName,
      created_at: new Date().toISOString(),
    };
    await pool.query(
      `UPDATE support_tickets
       SET messages = messages || $1::jsonb, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify([message]), ticketId]
    );
  }

  async addInternalNote(
    ticketId: string,
    agentName: string,
    content: string
  ): Promise<void> {
    const note: InternalNote = {
      id: crypto.randomUUID(),
      agent_name: agentName,
      content,
      created_at: new Date().toISOString(),
    };
    await pool.query(
      `UPDATE support_tickets
       SET internal_notes = internal_notes || $1::jsonb, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify([note]), ticketId]
    );
  }

  async updateStatus(ticketId: string, status: string): Promise<void> {
    await pool.query(
      `UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, ticketId]
    );
  }

  async assignTicket(ticketId: string, agentId: string): Promise<void> {
    await pool.query(
      `UPDATE support_tickets SET assigned_to = $1, updated_at = NOW() WHERE id = $2`,
      [agentId, ticketId]
    );
  }

  async listFlows(): Promise<OnboardingFlow[]> {
    const { rows } = await pool.query(
      `SELECT * FROM onboarding_flows ORDER BY created_at DESC`
    );
    return rows;
  }

  async createFlow(
    name: string,
    autoTrigger: boolean,
    steps: OnboardingStep[]
  ): Promise<OnboardingFlow> {
    const { rows } = await pool.query(
      `INSERT INTO onboarding_flows (name, auto_trigger, steps)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, autoTrigger, JSON.stringify(steps)]
    );
    return rows[0];
  }

  async updateFlow(
    flowId: string,
    data: Partial<{ name: string; auto_trigger: boolean; steps: OnboardingStep[] }>
  ): Promise<OnboardingFlow> {
    const { rows } = await pool.query(
      `UPDATE onboarding_flows
       SET name = COALESCE($1, name),
           auto_trigger = COALESCE($2, auto_trigger),
           steps = COALESCE($3, steps),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        data.name ?? null,
        data.auto_trigger ?? null,
        data.steps ? JSON.stringify(data.steps) : null,
        flowId,
      ]
    );
    return rows[0];
  }

  async deleteFlow(flowId: string): Promise<void> {
    await pool.query(`DELETE FROM onboarding_flows WHERE id = $1`, [flowId]);
  }

  async getDashboardStats(): Promise<{
    openTickets: number;
    resolvedToday: number;
    avgResponseMins: number;
    csatScore: number;
  }> {
    const [openResult, resolvedResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as count FROM support_tickets WHERE status IN ('open', 'pending')`
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM support_tickets WHERE status = 'resolved' AND DATE(updated_at) = CURRENT_DATE`
      ),
    ]);

    return {
      openTickets: parseInt(openResult.rows[0].count, 10),
      resolvedToday: parseInt(resolvedResult.rows[0].count, 10),
      avgResponseMins: 8,
      csatScore: 94,
    };
  }
}
