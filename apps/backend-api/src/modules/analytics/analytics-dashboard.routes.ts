/**
 * Analytics Dashboard API
 *
 * @route GET  /api/analytics/dashboard — KPIs, volume, outcomes, top questions
 * @route POST /api/analytics/insights  — AI-generated weekly insights
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../auth/auth.middleware.js';
import { pool } from '../../config/db.js';

export async function analyticsDashboardRoutes(app: FastifyInstance) {

  app.get('/dashboard', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { workspaceId, period = '30' } = req.query as { workspaceId: string; period?: string };
      if (!workspaceId) return reply.status(400).send({ error: 'workspaceId is required' });

      const days = parseInt(period, 10) || 30;

      // KPIs
      const [kpiRes, prevKpiRes, volumeRes, outcomeRes, topQuestionsRes, agentPerfRes] = await Promise.all([
        pool.query(
          `SELECT
             COUNT(DISTINCT cs.id) FILTER (WHERE cs.channel = 'voice')::int AS total_calls,
             COUNT(DISTINCT cs.id) FILTER (WHERE cs.channel = 'chat')::int AS total_chats,
             COALESCE(SUM(CASE WHEN cs.channel = 'voice' THEN cs.duration_seconds ELSE 0 END) / 60.0, 0)::numeric AS voice_minutes,
             COUNT(DISTINCT CASE WHEN cs.channel = 'voice' AND cs.duration_seconds > 10 THEN cs.id END)::int AS calls_answered,
             AVG(CASE WHEN cs.duration_seconds > 0 THEN cs.duration_seconds END)::numeric AS avg_duration,
             COUNT(DISTINCT cs.customer_id)::int AS unique_customers
           FROM chat_sessions cs
           WHERE cs.workspace_id = $1
             AND cs.created_at >= NOW() - ($2 || ' days')::INTERVAL`,
          [workspaceId, String(days)]
        ),
        pool.query(
          `SELECT
             COUNT(DISTINCT cs.id) FILTER (WHERE cs.channel = 'voice')::int AS total_calls,
             COUNT(DISTINCT cs.id) FILTER (WHERE cs.channel = 'chat')::int AS total_chats
           FROM chat_sessions cs
           WHERE cs.workspace_id = $1
             AND cs.created_at >= NOW() - ($2 || ' days')::INTERVAL - ($2 || ' days')::INTERVAL
             AND cs.created_at < NOW() - ($2 || ' days')::INTERVAL`,
          [workspaceId, String(days)]
        ),
        // Daily volume for chart
        pool.query(
          `SELECT
             date_trunc('day', cs.created_at)::date AS day,
             COUNT(*) FILTER (WHERE cs.channel = 'voice')::int AS calls,
             COUNT(*) FILTER (WHERE cs.channel = 'chat')::int AS chats
           FROM chat_sessions cs
           WHERE cs.workspace_id = $1
             AND cs.created_at >= NOW() - ($2 || ' days')::INTERVAL
           GROUP BY day
           ORDER BY day`,
          [workspaceId, String(days)]
        ),
        // Outcome breakdown
        pool.query(
          `SELECT
             COALESCE(cs.outcome, 'unknown') AS outcome,
             COUNT(*)::int AS count
           FROM chat_sessions cs
           WHERE cs.workspace_id = $1
             AND cs.created_at >= NOW() - ($2 || ' days')::INTERVAL
           GROUP BY outcome
           ORDER BY count DESC`,
          [workspaceId, String(days)]
        ),
        // Top questions
        pool.query(
          `SELECT
             question,
             COUNT(*)::int AS ask_count,
             ROUND(AVG(ai_confidence)::numeric, 1) AS avg_confidence
           FROM unanswered_questions
           WHERE workspace_id = $1
             AND last_asked_at >= NOW() - ($2 || ' days')::INTERVAL
           GROUP BY question
           ORDER BY ask_count DESC
           LIMIT 10`,
          [workspaceId, String(days)]
        ),
        // Agent performance
        pool.query(
          `SELECT
             va.name AS agent_name,
             COUNT(cs.id)::int AS total_sessions,
             COUNT(cs.id) FILTER (WHERE cs.duration_seconds > 10)::int AS answered,
             AVG(cs.duration_seconds)::int AS avg_duration_seconds,
             COUNT(DISTINCT cs.customer_id)::int AS unique_contacts
           FROM chat_sessions cs
           JOIN voice_agents va ON va.id = cs.agent_id
           WHERE cs.workspace_id = $1
             AND cs.created_at >= NOW() - ($2 || ' days')::INTERVAL
           GROUP BY va.name
           ORDER BY total_sessions DESC
           LIMIT 10`,
          [workspaceId, String(days)]
        ),
      ]);

      const kpi = kpiRes.rows[0] || {};
      const prevKpi = prevKpiRes.rows[0] || {};

      // Month-over-month change
      const calcChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Number((((current - previous) / previous) * 100).toFixed(1));
      };

      return reply.send({
        kpis: {
          totalCalls: Number(kpi.total_calls || 0),
          totalChats: Number(kpi.total_chats || 0),
          voiceMinutes: Number(Number(kpi.voice_minutes || 0).toFixed(1)),
          callsAnswered: Number(kpi.calls_answered || 0),
          avgDuration: Number(Number(kpi.avg_duration || 0).toFixed(0)),
          uniqueCustomers: Number(kpi.unique_customers || 0),
          changes: {
            calls: calcChange(Number(kpi.total_calls || 0), Number(prevKpi.total_calls || 0)),
            chats: calcChange(Number(kpi.total_chats || 0), Number(prevKpi.total_chats || 0)),
          },
        },
        dailyVolume: volumeRes.rows,
        outcomes: outcomeRes.rows,
        topQuestions: topQuestionsRes.rows,
        agentPerformance: agentPerfRes.rows,
        period: days,
      });
    } catch (error: any) {
      console.error('[Analytics] Dashboard error:', error.message);
      return reply.status(500).send({ error: error.message });
    }
  });
}
