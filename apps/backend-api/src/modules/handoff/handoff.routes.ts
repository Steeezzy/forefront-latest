import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { pool } from '../../config/db.js';

export async function handoffRoutes(app: FastifyInstance) {
  app.get('/:workspaceId/operators', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const result = await pool.query(
        `SELECT *
         FROM operators
         WHERE workspace_id = $1
         ORDER BY name ASC`,
        [workspaceId]
      );

      return reply.send({ operators: result.rows });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.post('/:workspaceId/operators', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { name, phone, email, role, maxChats } = request.body as any;
      const operatorId = randomUUID();

      await pool.query(
        `INSERT INTO operators (
           id,
           workspace_id,
           name,
           phone,
           email,
           role,
           max_chats
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [operatorId, workspaceId, name, phone || null, email || null, role || 'agent', maxChats || 5]
      );

      return reply.send({ operatorId });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.put('/:workspaceId/operators/:operatorId', async (request, reply) => {
    try {
      const { operatorId } = request.params as { workspaceId: string; operatorId: string };
      const { name, phone, email, role, maxChats, status } = request.body as any;

      await pool.query(
        `UPDATE operators
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             email = COALESCE($3, email),
             role = COALESCE($4, role),
             max_chats = COALESCE($5, max_chats),
             status = COALESCE($6, status)
         WHERE id = $7`,
        [name, phone, email, role, maxChats, status, operatorId]
      );

      return reply.send({ updated: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.delete('/:workspaceId/operators/:operatorId', async (request, reply) => {
    try {
      const { operatorId } = request.params as { workspaceId: string; operatorId: string };
      await pool.query(
        `DELETE FROM operators
         WHERE id = $1`,
        [operatorId]
      );

      return reply.send({ deleted: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.put('/:workspaceId/operators/:operatorId/status', async (request, reply) => {
    try {
      const { operatorId } = request.params as { workspaceId: string; operatorId: string };
      const { status } = request.body as { status: 'online' | 'offline' | 'busy' };

      await pool.query(
        `UPDATE operators
         SET status = $1
         WHERE id = $2`,
        [status, operatorId]
      );

      return reply.send({ updated: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.post('/:workspaceId/request', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { channel, customerName, customerContact, notes, customerId } = request.body as any;
      const handoffId = randomUUID();

      const available = await pool.query(
        `SELECT *
         FROM operators
         WHERE workspace_id = $1
           AND status = 'online'
           AND current_chats < max_chats
         ORDER BY current_chats ASC, created_at ASC
         LIMIT 1`,
        [workspaceId]
      );

      if (available.rows[0]) {
        const operator = available.rows[0];

        await pool.query(
          `INSERT INTO handoff_sessions (
             id,
             workspace_id,
             operator_id,
             channel,
             customer_id,
             customer_name,
             customer_contact,
             status,
             notes
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8)`,
          [
            handoffId,
            workspaceId,
            operator.id,
            channel,
            customerId || null,
            customerName || null,
            customerContact || null,
            notes || null,
          ]
        );

        await pool.query(
          `UPDATE operators
           SET current_chats = current_chats + 1
           WHERE id = $1`,
          [operator.id]
        );

        return reply.send({
          handoffId,
          operator: operator.name,
          status: 'assigned',
        });
      }

      await pool.query(
        `INSERT INTO handoff_sessions (
           id,
           workspace_id,
           channel,
           customer_id,
           customer_name,
           customer_contact,
           status,
           notes
         ) VALUES ($1, $2, $3, $4, $5, $6, 'waiting', $7)`,
        [
          handoffId,
          workspaceId,
          channel,
          customerId || null,
          customerName || null,
          customerContact || null,
          notes || null,
        ]
      );

      return reply.send({ handoffId, status: 'queued' });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.post('/:workspaceId/sessions/:sessionId/end', async (request, reply) => {
    try {
      const { sessionId } = request.params as { workspaceId: string; sessionId: string };
      const sessionResult = await pool.query(
        `SELECT *
         FROM handoff_sessions
         WHERE id = $1
         LIMIT 1`,
        [sessionId]
      );

      const session = sessionResult.rows[0];
      if (session?.operator_id) {
        await pool.query(
          `UPDATE operators
           SET current_chats = GREATEST(current_chats - 1, 0)
           WHERE id = $1`,
          [session.operator_id]
        );
      }

      await pool.query(
        `UPDATE handoff_sessions
         SET status = 'ended',
             ended_at = NOW()
         WHERE id = $1`,
        [sessionId]
      );

      return reply.send({ ended: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:workspaceId/sessions', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { status, page = '1', limit = '20' } = request.query as {
        status?: string;
        page?: string;
        limit?: string;
      };

      const safePage = Math.max(Number(page) || 1, 1);
      const safeLimit = Math.max(Number(limit) || 20, 1);
      const offset = (safePage - 1) * safeLimit;

      const params: any[] = [workspaceId];
      let query = `
        SELECT hs.*, o.name AS operator_name
        FROM handoff_sessions hs
        LEFT JOIN operators o ON hs.operator_id = o.id
        WHERE hs.workspace_id = $1
      `;

      if (status) {
        params.push(status);
        query += ` AND hs.status = $${params.length}`;
      }

      params.push(safeLimit, offset);
      query += ` ORDER BY hs.started_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const result = await pool.query(query, params);
      return reply.send({ sessions: result.rows, page: safePage, limit: safeLimit });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:workspaceId/sessions/active', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const result = await pool.query(
        `SELECT hs.*, o.name AS operator_name
         FROM handoff_sessions hs
         LEFT JOIN operators o ON hs.operator_id = o.id
         WHERE hs.workspace_id = $1
           AND hs.status = 'active'
         ORDER BY hs.started_at DESC`,
        [workspaceId]
      );

      return reply.send({ sessions: result.rows });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:workspaceId/queue', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const result = await pool.query(
        `SELECT *
         FROM handoff_sessions
         WHERE workspace_id = $1
           AND status = 'waiting'
         ORDER BY started_at ASC`,
        [workspaceId]
      );

      return reply.send({ sessions: result.rows });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
