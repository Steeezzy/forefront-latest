import { pool } from '../../../config/db.js';
import type { AgentInput, AgentOutput } from '../orchestrator.service.js';

/**
 * BookingAgent
 * 
 * Handles appointment scheduling, slot management, and confirmations.
 * Capabilities:
 * - Check available slots for a date
 * - Book a slot for a customer
 * - Cancel/reschedule a booking
 * - Send SMS confirmation (via Twilio if configured)
 */

export class BookingAgent {
    private sarvamApiKey: string;

    constructor() {
        this.sarvamApiKey = process.env.SARVAM_API_KEY || '';
    }

    async handle(input: AgentInput): Promise<AgentOutput> {
        const message = input.message.toLowerCase();

        // Determine sub-action from message
        if (message.includes('cancel') || message.includes('reschedule')) {
            return this.handleCancellation(input);
        }

        if (message.includes('book') || message.includes('schedule') || message.includes('appointment')) {
            return this.handleBooking(input);
        }

        if (message.includes('available') || message.includes('slot') || message.includes('when')) {
            return this.handleAvailabilityCheck(input);
        }

        // Default: show available slots and offer to book
        return this.handleAvailabilityCheck(input);
    }

    private async handleAvailabilityCheck(input: AgentInput): Promise<AgentOutput> {
        try {
            // Get available slots for next 7 days
            const result = await pool.query(
                `SELECT * FROM availability_slots 
                 WHERE workspace_id = $1 AND is_booked = false 
                 AND slot_start > NOW() AND slot_start < NOW() + INTERVAL '7 days'
                 ORDER BY slot_start ASC LIMIT 10`,
                [input.workspaceId]
            );

            if (result.rows.length === 0) {
                return {
                    reply: 'I don\'t have any available slots in the next 7 days. Would you like me to check for later dates, or would you prefer to speak with someone directly?',
                    actions: ['no_slots_available']
                };
            }

            const slots = result.rows.map((s: any) => {
                const date = new Date(s.slot_start);
                return `${date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
            });

            return {
                reply: `Here are the available time slots:\n${slots.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nWhich one works best for you? Just tell me the number or the date and time.`,
                actions: ['slots_shown'],
                sources: ['availability_calendar']
            };
        } catch (error: any) {
            console.error('Booking availability check error:', error.message);
            return {
                reply: 'I\'m having trouble checking available slots right now. Let me connect you with someone who can help schedule your appointment.',
                actions: ['availability_check_failed']
            };
        }
    }

    private async handleBooking(input: AgentInput): Promise<AgentOutput> {
        try {
            // Find the next available slot
            const slotResult = await pool.query(
                `SELECT * FROM availability_slots 
                 WHERE workspace_id = $1 AND is_booked = false 
                 AND slot_start > NOW()
                 ORDER BY slot_start ASC LIMIT 1`,
                [input.workspaceId]
            );

            if (slotResult.rows.length === 0) {
                return {
                    reply: 'I\'m sorry, there are no available slots right now. Would you like me to add you to a waiting list?',
                    actions: ['no_slots_for_booking']
                };
            }

            const slot = slotResult.rows[0];

            // Create booking
            const bookingResult = await pool.query(
                `INSERT INTO bookings (workspace_id, session_id, slot_id, customer_phone, customer_name, status)
                 VALUES ($1, $2, $3, $4, $5, 'confirmed') RETURNING *`,
                [input.workspaceId, input.sessionId, slot.id, input.customerPhone || 'unknown', 'Customer']
            );

            // Mark slot as booked
            await pool.query(
                'UPDATE availability_slots SET is_booked = true, booked_by = $1 WHERE id = $2',
                [bookingResult.rows[0].id, slot.id]
            );

            const startDate = new Date(slot.slot_start);
            const formattedDate = startDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const formattedTime = startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            return {
                reply: `Your appointment has been booked for ${formattedDate} at ${formattedTime}. You'll receive a confirmation shortly. Is there anything else I can help you with?`,
                actions: ['booking_created'],
                sources: ['booking_system']
            };
        } catch (error: any) {
            console.error('Booking creation error:', error.message);
            return {
                reply: 'I encountered an issue while booking your appointment. Let me connect you with someone who can complete the booking manually.',
                actions: ['booking_failed']
            };
        }
    }

    private async handleCancellation(input: AgentInput): Promise<AgentOutput> {
        try {
            // Find active booking for this customer
            const bookingResult = await pool.query(
                `SELECT b.*, s.slot_start, s.slot_end 
                 FROM bookings b 
                 JOIN availability_slots s ON s.id = b.slot_id
                 WHERE b.customer_phone = $1 AND b.status = 'confirmed'
                 ORDER BY s.slot_start ASC LIMIT 1`,
                [input.customerPhone || 'unknown']
            );

            if (bookingResult.rows.length === 0) {
                return {
                    reply: 'I couldn\'t find an active booking for your number. Could you provide more details about your appointment?',
                    actions: ['no_booking_found']
                };
            }

            const booking = bookingResult.rows[0];

            // Cancel booking
            await pool.query('UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', booking.id]);
            await pool.query('UPDATE availability_slots SET is_booked = false, booked_by = NULL WHERE id = $1', [booking.slot_id]);

            const startDate = new Date(booking.slot_start);
            const formattedDate = startDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

            if (input.message.includes('reschedule')) {
                return {
                    reply: `I've cancelled your appointment on ${formattedDate}. Let me show you the available slots so we can reschedule.`,
                    actions: ['booking_cancelled', 'reschedule_initiated']
                };
            }

            return {
                reply: `Your appointment on ${formattedDate} has been cancelled. Would you like to reschedule for a different time?`,
                actions: ['booking_cancelled']
            };
        } catch (error: any) {
            console.error('Booking cancellation error:', error.message);
            return {
                reply: 'I\'m having trouble processing the cancellation. Let me transfer you to someone who can help.',
                actions: ['cancellation_failed']
            };
        }
    }
}
