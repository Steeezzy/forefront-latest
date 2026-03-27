import { pool } from '../../../config/db.js';
import type { AgentInput, AgentOutput } from '../orchestrator.service.js';

/**
 * CRMAgent
 * 
 * Handles customer lookup, profile management, and support ticket creation.
 * Capabilities:
 * - Look up customer by phone or email
 * - Update customer profile with new info
 * - Create support tickets from conversations
 * - Track order status
 * - Auto-create customer on first contact
 */

export class CRMAgent {
    constructor() {}

    async handle(input: AgentInput): Promise<AgentOutput> {
        const message = input.message.toLowerCase();

        if (message.includes('order') || message.includes('tracking') || message.includes('delivery') || message.includes('status')) {
            return this.handleOrderStatus(input);
        }

        if (message.includes('cancel') || message.includes('refund') || message.includes('complaint') || message.includes('issue') || message.includes('ticket')) {
            return this.handleTicketCreation(input);
        }

        if (message.includes('update') || message.includes('change') || message.includes('email') || message.includes('address')) {
            return this.handleProfileUpdate(input);
        }

        // Default: lookup customer and provide context
        return this.handleCustomerLookup(input);
    }

    /**
     * Find or create customer record
     */
    async getOrCreateCustomer(workspaceId: string, phone?: string, email?: string): Promise<any> {
        if (!phone && !email) return null;

        let customer;
        if (phone) {
            const result = await pool.query(
                'SELECT * FROM customers WHERE workspace_id = $1 AND phone = $2',
                [workspaceId, phone]
            );
            customer = result.rows[0];
        }

        if (!customer && email) {
            const result = await pool.query(
                'SELECT * FROM customers WHERE workspace_id = $1 AND email = $2',
                [workspaceId, email]
            );
            customer = result.rows[0];
        }

        if (!customer && phone) {
            // Auto-create on first contact
            const result = await pool.query(
                `INSERT INTO customers (workspace_id, phone, name, last_contact_at, total_calls)
                 VALUES ($1, $2, 'Unknown', NOW(), 1)
                 ON CONFLICT (workspace_id, phone) DO UPDATE SET last_contact_at = NOW(), total_calls = customers.total_calls + 1
                 RETURNING *`,
                [workspaceId, phone]
            );
            customer = result.rows[0];
        }

        return customer;
    }

    private async handleCustomerLookup(input: AgentInput): Promise<AgentOutput> {
        try {
            const customer = await this.getOrCreateCustomer(input.workspaceId, input.customerPhone);
            
            if (!customer) {
                return {
                    reply: 'I can help you with your account. Could you please provide your registered phone number or email?',
                    actions: ['customer_lookup_needed']
                };
            }

            // Update last contact
            await pool.query(
                'UPDATE customers SET last_contact_at = NOW(), total_calls = total_calls + 1 WHERE id = $1',
                [customer.id]
            );

            const name = customer.name !== 'Unknown' ? customer.name : 'there';
            return {
                reply: `Hello ${name}! I can see your account. How can I assist you today? I can help with order status, account updates, or any other queries.`,
                actions: ['customer_identified'],
                sources: ['crm_database']
            };
        } catch (error: any) {
            console.error('Customer lookup error:', error.message);
            return {
                reply: 'I\'m ready to help you. What can I assist you with today?',
                actions: ['customer_lookup_failed']
            };
        }
    }

    private async handleOrderStatus(input: AgentInput): Promise<AgentOutput> {
        // In a real implementation, this would query an order management system
        // For now, provide a helpful response
        return {
            reply: 'I\'d be happy to help with your order. Could you please share your order number? It usually starts with ORD- or can be found in your confirmation email.',
            actions: ['order_status_requested'],
            sources: ['crm_database']
        };
    }

    private async handleTicketCreation(input: AgentInput): Promise<AgentOutput> {
        try {
            const customer = await this.getOrCreateCustomer(input.workspaceId, input.customerPhone);

            const ticketResult = await pool.query(
                `INSERT INTO support_tickets (workspace_id, session_id, customer_id, subject, description, status, priority)
                 VALUES ($1, $2, $3, $4, $5, 'open', $6) RETURNING *`,
                [
                    input.workspaceId,
                    input.sessionId,
                    customer?.id || null,
                    `Issue reported: ${input.message.substring(0, 100)}`,
                    input.message,
                    input.message.includes('urgent') || input.message.includes('critical') ? 'high' : 'medium'
                ]
            );

            const ticketId = ticketResult.rows[0].id.substring(0, 8).toUpperCase();

            return {
                reply: `I've created a support ticket (TK-${ticketId}) for your issue. Our team will review it and get back to you shortly. Is there anything else I can help with?`,
                actions: ['ticket_created'],
                sources: ['support_system']
            };
        } catch (error: any) {
            console.error('Ticket creation error:', error.message);
            return {
                reply: 'I understand your concern. Let me connect you with a team member who can help resolve this right away.',
                actions: ['ticket_creation_failed', 'escalate_suggested']
            };
        }
    }

    private async handleProfileUpdate(input: AgentInput): Promise<AgentOutput> {
        return {
            reply: 'I can help update your profile. What information would you like to change? I can update your name, email, or other contact details.',
            actions: ['profile_update_requested']
        };
    }
}
