import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';

/**
 * Bookings API Routes
 * 
 * CRUD for availability slots and customer bookings.
 */

export default async function bookingsRoutes(app: FastifyInstance) {

    // List available slots for a workspace
    app.get('/slots', async (request, reply) => {
        try {
            const { workspaceId, agentId, date } = request.query as any;
            
            let query = `SELECT * FROM availability_slots WHERE workspace_id = $1 AND is_booked = false AND slot_start > NOW()`;
            const params: any[] = [workspaceId];
            let idx = 2;

            if (agentId) {
                query += ` AND agent_id = $${idx}`;
                params.push(agentId);
                idx++;
            }

            if (date) {
                query += ` AND slot_date = $${idx}`;
                params.push(date);
                idx++;
            }

            query += ' ORDER BY slot_start ASC';
            const result = await pool.query(query, params);
            return result.rows;
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // Create availability slot(s)
    app.post('/slots', async (request, reply) => {
        try {
            const { workspaceId, agentId, slots } = request.body as any;
            
            const created = [];
            for (const slot of (slots || [])) {
                const result = await pool.query(
                    `INSERT INTO availability_slots (workspace_id, agent_id, slot_date, slot_start, slot_end)
                     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    [workspaceId, agentId || null, slot.date, slot.start, slot.end]
                );
                created.push(result.rows[0]);
            }

            return { success: true, data: created };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // List bookings
    app.get('/', async (request, reply) => {
        try {
            const { workspaceId, status, limit, offset } = request.query as any;

            let query = `SELECT b.*, s.slot_start, s.slot_end 
                         FROM bookings b 
                         LEFT JOIN availability_slots s ON s.id = b.slot_id
                         WHERE b.workspace_id = $1`;
            const params: any[] = [workspaceId];
            let idx = 2;

            if (status) {
                query += ` AND b.status = $${idx}`;
                params.push(status);
                idx++;
            }

            query += ' ORDER BY s.slot_start DESC';
            query += ` LIMIT $${idx} OFFSET $${idx + 1}`;
            params.push(parseInt(limit) || 50, parseInt(offset) || 0);

            const result = await pool.query(query, params);
            return result.rows;
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // Create a booking manually
    app.post('/', async (request, reply) => {
        try {
            const { workspaceId, slotId, customerName, customerPhone, customerEmail, notes } = request.body as any;
            
            const result = await pool.query(
                `INSERT INTO bookings (workspace_id, slot_id, customer_name, customer_phone, customer_email, notes)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [workspaceId, slotId, customerName, customerPhone, customerEmail, notes]
            );

            // Mark slot as booked
            if (slotId) {
                await pool.query(
                    'UPDATE availability_slots SET is_booked = true, booked_by = $1 WHERE id = $2',
                    [result.rows[0].id, slotId]
                );
            }

            return { success: true, data: result.rows[0] };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // Cancel a booking
    app.put('/:id/cancel', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
            if (booking.rows.length === 0) {
                return reply.status(404).send({ error: 'Booking not found' });
            }

            await pool.query('UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', id]);
            
            // Free up the slot
            if (booking.rows[0].slot_id) {
                await pool.query(
                    'UPDATE availability_slots SET is_booked = false, booked_by = NULL WHERE id = $1',
                    [booking.rows[0].slot_id]
                );
            }

            return { success: true };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });
}
