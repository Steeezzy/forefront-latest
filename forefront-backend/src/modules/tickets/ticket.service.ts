/**
 * TicketService — Full ticketing system with state machine, SLA, and assignment.
 *
 * Uses existing `tickets` and `ticket_comments` tables (migration 011).
 *
 * @class TicketService
 * @example
 *   const svc = new TicketService();
 *   const ticket = await svc.createTicket({ ... });
 *   await svc.updateTicketStatus(ticket.id, workspaceId, 'pending');
 */

import { pool } from '../../config/db.js';
import { z } from 'zod';
import type { TicketFilters, TicketStatus, TicketPriority, TicketSource } from '../../types/NormalizedMessage.js';
import { integrationEvents } from '../integrations/integration-events.service.js';

// ─── Validation Schemas ──────────────────────────────────────────────

export const createTicketSchema = z.object({
    workspace_id: z.string().uuid(),
    conversation_id: z.string().uuid().optional(),
    subject: z.string().min(1).max(500),
    description: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    source: z.enum(['chat', 'email', 'manual', 'widget', 'api', 'flow']).default('manual'),
    assigned_to: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    requester_name: z.string().max(255).optional(),
    requester_email: z.string().email().optional(),
    custom_fields: z.record(z.string(), z.any()).optional(),
});

export const updateTicketSchema = z.object({
    status: z.enum(['open', 'pending', 'solved', 'closed', 'unassigned']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    tags: z.array(z.string()).optional(),
    subject: z.string().min(1).max(500).optional(),
    custom_fields: z.record(z.string(), z.any()).optional(),
});

export const addCommentSchema = z.object({
    ticket_id: z.string().uuid(),
    author_type: z.enum(['agent', 'customer', 'system']),
    author_id: z.string().uuid().optional(),
    author_name: z.string().max(255).optional(),
    content: z.string().min(1),
    is_internal: z.boolean().default(false),
});

// ─── Valid State Transitions ─────────────────────────────────────────

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    unassigned: ['open', 'pending', 'closed'],
    open: ['pending', 'solved', 'closed'],
    pending: ['open', 'solved', 'closed'],
    solved: ['open', 'closed'],
    closed: ['open'], // can reopen
};

// ─── Ticket Number Generator ────────────────────────────────────────

async function generateTicketNumber(workspaceId: string): Promise<string> {
    const result = await pool.query(
        `SELECT COUNT(*) AS count FROM tickets WHERE workspace_id = $1`,
        [workspaceId]
    );
    const count = parseInt(result.rows[0].count, 10) + 1;
    return `TKT-${String(count).padStart(6, '0')}`;
}

// ─── Service ─────────────────────────────────────────────────────────

export class TicketService {
    /**
     * Create a new ticket, auto-generating the ticket number.
     */
    async createTicket(data: z.infer<typeof createTicketSchema>) {
        const ticketNumber = await generateTicketNumber(data.workspace_id);
        const initialStatus: TicketStatus = data.assigned_to ? 'open' : 'unassigned';

        const result = await pool.query(
            `INSERT INTO tickets
         (workspace_id, conversation_id, ticket_number, subject, description,
          status, priority, assigned_to, tags, source,
          requester_name, requester_email, custom_fields)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
            [
                data.workspace_id,
                data.conversation_id ?? null,
                ticketNumber,
                data.subject,
                data.description ?? null,
                initialStatus,
                data.priority,
                data.assigned_to ?? null,
                data.tags ?? [],
                data.source,
                data.requester_name ?? null,
                data.requester_email ?? null,
                JSON.stringify(data.custom_fields ?? {}),
            ]
        );

        const ticket = result.rows[0];

        // Fire ticket.created event (Zapier, Slack) — non-blocking
        integrationEvents.fireEvent('ticket.created', {
            workspaceId: data.workspace_id,
            ticket: {
                id: ticket.id,
                subject: data.subject,
            },
            customFields: {
                ticketNumber: ticketNumber,
            }
        }).catch(e => console.error('[TicketService] Event fire error:', e.message));

        return ticket;
    }

    /**
     * List tickets with filtering, sorting, and pagination.
     */
    async getTickets(workspaceId: string, filters: TicketFilters = {}) {
        const conditions: string[] = ['t.workspace_id = $1'];
        const values: any[] = [workspaceId];
        let paramIdx = 2;

        if (filters.status && filters.status !== 'all') {
            conditions.push(`t.status = $${paramIdx++}`);
            values.push(filters.status);
        }
        if (filters.priority) {
            conditions.push(`t.priority = $${paramIdx++}`);
            values.push(filters.priority);
        }
        if (filters.assigned_to === 'unassigned') {
            conditions.push(`t.assigned_to IS NULL`);
        } else if (filters.assigned_to) {
            conditions.push(`t.assigned_to = $${paramIdx++}`);
            values.push(filters.assigned_to);
        }
        if (filters.source) {
            conditions.push(`t.source = $${paramIdx++}`);
            values.push(filters.source);
        }
        if (filters.tags && filters.tags.length > 0) {
            conditions.push(`t.tags && $${paramIdx++}`);
            values.push(filters.tags);
        }
        if (filters.search) {
            conditions.push(`(t.subject ILIKE $${paramIdx} OR t.ticket_number ILIKE $${paramIdx} OR t.requester_email ILIKE $${paramIdx})`);
            values.push(`%${filters.search}%`);
            paramIdx++;
        }

        const sortCol = filters.sort_by || 'created_at';
        const sortDir = filters.sort_order === 'asc' ? 'ASC' : 'DESC';
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 100);
        const offset = (page - 1) * limit;

        const whereClause = conditions.join(' AND ');

        const [ticketsRes, countRes] = await Promise.all([
            pool.query(
                `SELECT t.*, u.email AS assignee_email
         FROM tickets t
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE ${whereClause}
         ORDER BY ${sortCol} ${sortDir}
         LIMIT ${limit} OFFSET ${offset}`,
                values
            ),
            pool.query(
                `SELECT COUNT(*) AS total FROM tickets t WHERE ${whereClause}`,
                values
            ),
        ]);

        return {
            tickets: ticketsRes.rows,
            pagination: {
                page,
                limit,
                total: parseInt(countRes.rows[0].total, 10),
                total_pages: Math.ceil(parseInt(countRes.rows[0].total, 10) / limit),
            },
        };
    }

    /**
     * Get a single ticket with its comments.
     */
    async getTicketById(ticketId: string, workspaceId: string) {
        const [ticketRes, commentsRes] = await Promise.all([
            pool.query(
                `SELECT t.*, u.email AS assignee_email
         FROM tickets t
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE t.id = $1 AND t.workspace_id = $2`,
                [ticketId, workspaceId]
            ),
            pool.query(
                `SELECT * FROM ticket_comments WHERE ticket_id = $1 ORDER BY created_at ASC`,
                [ticketId]
            ),
        ]);

        if (ticketRes.rows.length === 0) return null;

        return {
            ticket: ticketRes.rows[0],
            comments: commentsRes.rows,
        };
    }

    /**
     * Update ticket fields with state machine validation for status transitions.
     */
    async updateTicket(
        ticketId: string,
        workspaceId: string,
        data: z.infer<typeof updateTicketSchema>
    ) {
        // If changing status, validate the transition
        if (data.status) {
            const current = await pool.query(
                `SELECT status FROM tickets WHERE id = $1 AND workspace_id = $2`,
                [ticketId, workspaceId]
            );
            if (current.rows.length === 0) {
                throw new Error('Ticket not found');
            }
            const currentStatus = current.rows[0].status as TicketStatus;
            const allowed = VALID_TRANSITIONS[currentStatus];
            if (!allowed?.includes(data.status)) {
                throw new Error(
                    `Invalid status transition: ${currentStatus} → ${data.status}. Allowed: ${allowed?.join(', ')}`
                );
            }
        }

        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (data.status !== undefined) {
            setClauses.push(`status = $${idx++}`);
            values.push(data.status);
            // Set timestamp fields on status changes
            if (data.status === 'solved') {
                setClauses.push(`resolved_at = CURRENT_TIMESTAMP`);
            }
            if (data.status === 'closed') {
                setClauses.push(`closed_at = CURRENT_TIMESTAMP`);
            }
            if (data.status === 'open') {
                // Reopening clears resolved/closed timestamps
                setClauses.push(`resolved_at = NULL`);
                setClauses.push(`closed_at = NULL`);
            }
        }
        if (data.priority !== undefined) {
            setClauses.push(`priority = $${idx++}`);
            values.push(data.priority);
        }
        if (data.assigned_to !== undefined) {
            setClauses.push(`assigned_to = $${idx++}`);
            values.push(data.assigned_to);
            // If assigning and ticket is unassigned, auto-open
            if (data.assigned_to !== null && data.status === undefined) {
                setClauses.push(`status = CASE WHEN status = 'unassigned' THEN 'open' ELSE status END`);
            }
        }
        if (data.tags !== undefined) {
            setClauses.push(`tags = $${idx++}`);
            values.push(data.tags);
        }
        if (data.subject !== undefined) {
            setClauses.push(`subject = $${idx++}`);
            values.push(data.subject);
        }
        if (data.custom_fields !== undefined) {
            setClauses.push(`custom_fields = $${idx++}`);
            values.push(JSON.stringify(data.custom_fields));
        }

        if (setClauses.length === 0) {
            throw new Error('No fields to update');
        }

        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(ticketId, workspaceId);

        const result = await pool.query(
            `UPDATE tickets SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND workspace_id = $${idx + 1}
       RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            throw new Error('Ticket not found');
        }

        return result.rows[0];
    }

    /**
     * Assign a ticket to an agent (or unassign with null).
     * Prevents collision by using a single atomic UPDATE.
     */
    async assignTicket(
        ticketId: string,
        workspaceId: string,
        assignedTo: string | null,
        assignedBy: string
    ) {
        const result = await pool.query(
            `UPDATE tickets
       SET assigned_to = $1,
           status = CASE
             WHEN $1 IS NOT NULL AND status = 'unassigned' THEN 'open'
             WHEN $1 IS NULL THEN 'unassigned'
             ELSE status
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND workspace_id = $3
       RETURNING *`,
            [assignedTo, ticketId, workspaceId]
        );

        if (result.rows.length === 0) {
            throw new Error('Ticket not found');
        }

        // Add system comment for audit trail
        await this.addComment({
            ticket_id: ticketId,
            author_type: 'system',
            author_id: assignedBy,
            author_name: 'System',
            content: assignedTo
                ? `Ticket assigned to agent by ${assignedBy}`
                : `Ticket unassigned by ${assignedBy}`,
            is_internal: true,
        });

        return result.rows[0];
    }

    /**
     * Add a comment (public reply or internal note) to a ticket.
     */
    async addComment(data: z.infer<typeof addCommentSchema>) {
        const result = await pool.query(
            `INSERT INTO ticket_comments
         (ticket_id, author_type, author_id, author_name, content, is_internal)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
            [
                data.ticket_id,
                data.author_type,
                data.author_id ?? null,
                data.author_name ?? null,
                data.content,
                data.is_internal,
            ]
        );

        // Update ticket updated_at
        await pool.query(
            `UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [data.ticket_id]
        );

        return result.rows[0];
    }

    /**
     * Resolve a ticket. Optionally triggers CSAT survey (handled by caller).
     */
    async resolveTicket(ticketId: string, workspaceId: string, resolvedBy: string) {
        return this.updateTicket(ticketId, workspaceId, { status: 'solved' });
    }

    /**
     * Convert a live conversation into a ticket.
     */
    async convertConversationToTicket(
        conversationId: string,
        workspaceId: string,
        subject: string,
        createdBy: string
    ) {
        // Fetch conversation details
        const convo = await pool.query(
            `SELECT * FROM conversations WHERE id = $1 AND workspace_id = $2`,
            [conversationId, workspaceId]
        );

        if (convo.rows.length === 0) {
            throw new Error('Conversation not found');
        }

        const c = convo.rows[0];

        const ticket = await this.createTicket({
            workspace_id: workspaceId,
            conversation_id: conversationId,
            subject: subject || `Ticket from conversation`,
            source: 'chat' as TicketSource,
            requester_name: c.visitor_name,
            requester_email: c.visitor_email,
            assigned_to: c.assigned_to,
            priority: 'normal',
        });

        // Add system comment linking back to conversation
        await this.addComment({
            ticket_id: ticket.id,
            author_type: 'system',
            author_id: createdBy,
            author_name: 'System',
            content: `Ticket created from live conversation ${conversationId}`,
            is_internal: true,
        });

        return ticket;
    }

    /**
     * Get ticket statistics for the workspace dashboard.
     */
    async getTicketStats(workspaceId: string) {
        const result = await pool.query(
            `SELECT
         COUNT(*) FILTER (WHERE status = 'open') AS open_count,
         COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
         COUNT(*) FILTER (WHERE status = 'solved') AS solved_count,
         COUNT(*) FILTER (WHERE status = 'closed') AS closed_count,
         COUNT(*) FILTER (WHERE status = 'unassigned') AS unassigned_count,
         COUNT(*) FILTER (WHERE priority = 'urgent' AND status NOT IN ('solved','closed')) AS urgent_open,
         COUNT(*) FILTER (WHERE priority = 'high' AND status NOT IN ('solved','closed')) AS high_open,
         COUNT(*) AS total,
         AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - created_at)) / 3600)
           FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_hours
       FROM tickets
       WHERE workspace_id = $1`,
            [workspaceId]
        );

        return result.rows[0];
    }
}

export const ticketService = new TicketService();
