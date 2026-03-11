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
import { z } from 'zod';
import type { TicketFilters } from '../../types/NormalizedMessage.js';
export declare const createTicketSchema: z.ZodObject<{
    workspace_id: z.ZodString;
    conversation_id: z.ZodOptional<z.ZodString>;
    subject: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<{
        urgent: "urgent";
        high: "high";
        normal: "normal";
        low: "low";
    }>>;
    source: z.ZodDefault<z.ZodEnum<{
        email: "email";
        flow: "flow";
        api: "api";
        chat: "chat";
        manual: "manual";
        widget: "widget";
    }>>;
    assigned_to: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requester_name: z.ZodOptional<z.ZodString>;
    requester_email: z.ZodOptional<z.ZodString>;
    custom_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const updateTicketSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        open: "open";
        closed: "closed";
        pending: "pending";
        solved: "solved";
        unassigned: "unassigned";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        urgent: "urgent";
        high: "high";
        normal: "normal";
        low: "low";
    }>>;
    assigned_to: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    subject: z.ZodOptional<z.ZodString>;
    custom_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const addCommentSchema: z.ZodObject<{
    ticket_id: z.ZodString;
    author_type: z.ZodEnum<{
        system: "system";
        agent: "agent";
        customer: "customer";
    }>;
    author_id: z.ZodOptional<z.ZodString>;
    author_name: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    is_internal: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare class TicketService {
    /**
     * Create a new ticket, auto-generating the ticket number.
     */
    createTicket(data: z.infer<typeof createTicketSchema>): Promise<any>;
    /**
     * List tickets with filtering, sorting, and pagination.
     */
    getTickets(workspaceId: string, filters?: TicketFilters): Promise<{
        tickets: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    /**
     * Get a single ticket with its comments.
     */
    getTicketById(ticketId: string, workspaceId: string): Promise<{
        ticket: any;
        comments: any[];
    }>;
    /**
     * Update ticket fields with state machine validation for status transitions.
     */
    updateTicket(ticketId: string, workspaceId: string, data: z.infer<typeof updateTicketSchema>): Promise<any>;
    /**
     * Assign a ticket to an agent (or unassign with null).
     * Prevents collision by using a single atomic UPDATE.
     */
    assignTicket(ticketId: string, workspaceId: string, assignedTo: string | null, assignedBy: string): Promise<any>;
    /**
     * Add a comment (public reply or internal note) to a ticket.
     */
    addComment(data: z.infer<typeof addCommentSchema>): Promise<any>;
    /**
     * Resolve a ticket. Optionally triggers CSAT survey (handled by caller).
     */
    resolveTicket(ticketId: string, workspaceId: string, resolvedBy: string): Promise<any>;
    /**
     * Convert a live conversation into a ticket.
     */
    convertConversationToTicket(conversationId: string, workspaceId: string, subject: string, createdBy: string): Promise<any>;
    /**
     * Get ticket statistics for the workspace dashboard.
     */
    getTicketStats(workspaceId: string): Promise<any>;
}
export declare const ticketService: TicketService;
//# sourceMappingURL=ticket.service.d.ts.map