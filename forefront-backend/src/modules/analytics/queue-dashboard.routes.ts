/**
 * Queue Dashboard Routes — Health checks, metrics, and dead letter management.
 *
 * Endpoints:
 *   GET  /api/queue/health        — Live health for all BullMQ queues
 *   GET  /api/queue/dead-letters  — List permanently failed jobs
 *   POST /api/queue/retry/:id     — Retry a dead letter job
 *   POST /api/queue/discard/:id   — Discard a dead letter job
 *   POST /api/queue/retry-events  — Reprocess failed execution_events
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../auth/auth.middleware.js';
import { getQueueHealth } from '../../queues/execution-queues.js';
import { pool } from '../../config/db.js';

export async function queueDashboardRoutes(app: FastifyInstance) {

  // GET /health — Live BullMQ queue health (active/waiting/failed/delayed per queue)
  app.get('/health', { preHandler: [authenticate] }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const report = await getQueueHealth();
      const totalFailed = report.reduce((sum, q) => sum + Math.max(q.failed, 0), 0);
      const totalActive = report.reduce((sum, q) => sum + Math.max(q.active, 0), 0);

      return reply.send({
        status: totalFailed > 100 ? 'degraded' : 'healthy',
        totalActive,
        totalFailed,
        queues: report,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return reply.status(500).send({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // GET /dead-letters — List dead letter jobs with pagination
  app.get('/dead-letters', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = req.query as { status?: string; queue?: string; page?: string; limit?: string };
      const status = query.status || 'dead';
      const queueFilter = query.queue;
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
      const offset = (page - 1) * limit;

      const conditions = ['status = $1'];
      const values: any[] = [status];
      let paramIdx = 2;

      if (queueFilter) {
        conditions.push(`original_queue = $${paramIdx++}`);
        values.push(queueFilter);
      }

      const where = conditions.join(' AND ');

      const [jobsRes, countRes] = await Promise.all([
        pool.query(
          `SELECT * FROM dead_letter_jobs WHERE ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
          values
        ),
        pool.query(
          `SELECT COUNT(*)::int AS total FROM dead_letter_jobs WHERE ${where}`,
          values
        ),
      ]);

      return reply.send({
        jobs: jobsRes.rows,
        pagination: {
          page,
          limit,
          total: countRes.rows[0]?.total || 0,
          totalPages: Math.ceil((countRes.rows[0]?.total || 0) / limit),
        },
      });
    } catch (error: any) {
      // Table may not exist yet
      if (error.code === '42P01') {
        return reply.send({ jobs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
      }
      return reply.status(500).send({ error: error.message });
    }
  });

  // POST /retry/:id — Retry a dead letter job (marks as retried, re-enqueue is manual)
  app.post('/retry/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };

      const result = await pool.query(
        `UPDATE dead_letter_jobs
         SET status = 'retried', retried_at = NOW()
         WHERE id = $1 AND status = 'dead'
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Dead letter job not found or already processed' });
      }

      return reply.send({ success: true, job: result.rows[0] });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // POST /discard/:id — Permanently discard a dead letter job
  app.post('/discard/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };

      const result = await pool.query(
        `UPDATE dead_letter_jobs
         SET status = 'discarded', discarded_at = NOW()
         WHERE id = $1 AND status = 'dead'
         RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Dead letter job not found or already processed' });
      }

      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // POST /retry-events — Reprocess failed execution_events (bulk retry)
  app.post('/retry-events', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = req.body as { workspaceId?: string; limit?: number };
      const limitCount = Math.min(body.limit || 50, 200);

      const conditions = [`status = 'failed'`];
      const values: any[] = [];
      let paramIdx = 1;

      if (body.workspaceId) {
        conditions.push(`workspace_id = $${paramIdx++}`);
        values.push(body.workspaceId);
      }

      const failedEvents = await pool.query(
        `UPDATE execution_events
         SET status = 'pending', error_message = NULL, processed_at = NULL
         WHERE id IN (
           SELECT id FROM execution_events
           WHERE ${conditions.join(' AND ')}
           ORDER BY created_at DESC
           LIMIT ${limitCount}
         )
         RETURNING id`,
        values
      );

      return reply.send({
        success: true,
        retriedCount: failedEvents.rows.length,
        message: `${failedEvents.rows.length} failed events reset to pending for reprocessing`,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
