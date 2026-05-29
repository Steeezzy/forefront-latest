import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { pool } from '../../config/db.js';

export async function visitorsRoutes(app: FastifyInstance) {
  app.post('/heartbeat', async (request, reply) => {
    try {
      const {
        workspaceId,
        visitorId,
        pageUrl,
        pageTitle,
        referrer,
        device,
        browser,
      } = request.body as {
        workspaceId: string;
        visitorId: string;
        pageUrl?: string;
        pageTitle?: string;
        referrer?: string;
        device?: string;
        browser?: string;
      };

      const existing = await pool.query(
        `SELECT id
         FROM visitor_sessions
         WHERE workspace_id = $1
           AND visitor_key = $2
           AND last_seen_at > NOW() - INTERVAL '5 minutes'
         ORDER BY last_seen_at DESC
         LIMIT 1`,
        [workspaceId, visitorId]
      );

      if (existing.rows[0]) {
        await pool.query(
          `UPDATE visitor_sessions
           SET page_url = $1,
               page_title = $2,
               referrer = COALESCE($3, referrer),
               device = COALESCE($4, device),
               browser = COALESCE($5, browser),
               last_seen_at = NOW(),
               page_views = page_views + 1
           WHERE id = $6`,
          [pageUrl || null, pageTitle || null, referrer || null, device || null, browser || null, existing.rows[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO visitor_sessions (
             id,
             workspace_id,
             visitor_key,
             page_url,
             page_title,
             referrer,
             device,
             browser,
             started_at,
             last_seen_at,
             page_views,
             chat_started
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), 1, false)`,
          [
            randomUUID(),
            workspaceId,
            visitorId,
            pageUrl || null,
            pageTitle || null,
            referrer || null,
            device || null,
            browser || null,
          ]
        );
      }

      return reply.send({ ok: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:workspaceId/active', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const result = await pool.query(
        `SELECT *
         FROM visitor_sessions
         WHERE workspace_id = $1
           AND last_seen_at > NOW() - INTERVAL '5 minutes'
         ORDER BY last_seen_at DESC`,
        [workspaceId]
      );

      return reply.send({ count: result.rows.length, visitors: result.rows });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:workspaceId/history', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { from, to, page = '1', limit = '50' } = request.query as {
        from?: string;
        to?: string;
        page?: string;
        limit?: string;
      };

      const safePage = Math.max(Number(page) || 1, 1);
      const safeLimit = Math.max(Number(limit) || 50, 1);
      const offset = (safePage - 1) * safeLimit;

      const params: any[] = [workspaceId];
      let query = `
        SELECT *
        FROM visitor_sessions
        WHERE workspace_id = $1
      `;

      if (from) {
        params.push(from);
        query += ` AND started_at >= $${params.length}`;
      }

      if (to) {
        params.push(to);
        query += ` AND started_at <= $${params.length}`;
      }

      params.push(safeLimit, offset);
      query += ` ORDER BY started_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const result = await pool.query(query, params);
      return reply.send({ visitors: result.rows, page: safePage, limit: safeLimit });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:workspaceId/stats', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };

      const [active, today, week, topPages, deviceBreakdown, topReferrers] = await Promise.all([
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM visitor_sessions
           WHERE workspace_id = $1
             AND last_seen_at > NOW() - INTERVAL '5 minutes'`,
          [workspaceId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM visitor_sessions
           WHERE workspace_id = $1
             AND started_at >= CURRENT_DATE`,
          [workspaceId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM visitor_sessions
           WHERE workspace_id = $1
             AND started_at >= NOW() - INTERVAL '7 days'`,
          [workspaceId]
        ),
        pool.query(
          `SELECT page_url, COUNT(*)::int AS views
           FROM visitor_sessions
           WHERE workspace_id = $1
             AND started_at >= NOW() - INTERVAL '7 days'
             AND page_url IS NOT NULL
           GROUP BY page_url
           ORDER BY views DESC
           LIMIT 10`,
          [workspaceId]
        ),
        pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE LOWER(COALESCE(device, '')) = 'desktop')::int AS desktop,
             COUNT(*) FILTER (WHERE LOWER(COALESCE(device, '')) = 'mobile')::int AS mobile,
             COUNT(*) FILTER (WHERE LOWER(COALESCE(device, '')) = 'tablet')::int AS tablet
           FROM visitor_sessions
           WHERE workspace_id = $1
             AND started_at >= NOW() - INTERVAL '7 days'`,
          [workspaceId]
        ),
        pool.query(
          `SELECT referrer, COUNT(*)::int AS count
           FROM visitor_sessions
           WHERE workspace_id = $1
             AND started_at >= NOW() - INTERVAL '7 days'
             AND referrer IS NOT NULL
             AND referrer <> ''
           GROUP BY referrer
           ORDER BY count DESC
           LIMIT 10`,
          [workspaceId]
        ),
      ]);

      return reply.send({
        activeNow: Number(active.rows[0]?.count || 0),
        todayTotal: Number(today.rows[0]?.count || 0),
        thisWeekTotal: Number(week.rows[0]?.count || 0),
        topPages: topPages.rows,
        deviceBreakdown: {
          desktop: Number(deviceBreakdown.rows[0]?.desktop || 0),
          mobile: Number(deviceBreakdown.rows[0]?.mobile || 0),
          tablet: Number(deviceBreakdown.rows[0]?.tablet || 0),
        },
        topReferrers: topReferrers.rows,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:workspaceId/visitor/:visitorId', async (request, reply) => {
    try {
      const { workspaceId, visitorId } = request.params as { workspaceId: string; visitorId: string };
      const sessions = await pool.query(
        `SELECT *
         FROM visitor_sessions
         WHERE workspace_id = $1
           AND visitor_key = $2
         ORDER BY started_at DESC`,
        [workspaceId, visitorId]
      );

      const totals = await pool.query(
        `SELECT
           COUNT(*)::int AS total_visits,
           COALESCE(SUM(page_views), 0)::int AS total_page_views
         FROM visitor_sessions
         WHERE workspace_id = $1
           AND visitor_key = $2`,
        [workspaceId, visitorId]
      );

      return reply.send({
        visitorId,
        totalVisits: Number(totals.rows[0]?.total_visits || 0),
        totalPageViews: Number(totals.rows[0]?.total_page_views || 0),
        sessions: sessions.rows,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.post('/:workspaceId/visitor/:visitorId/chat', async (request, reply) => {
    try {
      const { workspaceId, visitorId } = request.params as { workspaceId: string; visitorId: string };
      await pool.query(
        `UPDATE visitor_sessions
         SET chat_started = true,
             last_seen_at = NOW()
         WHERE workspace_id = $1
           AND visitor_key = $2
           AND last_seen_at > NOW() - INTERVAL '5 minutes'`,
        [workspaceId, visitorId]
      );

      return reply.send({ updated: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
