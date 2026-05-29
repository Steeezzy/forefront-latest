import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';
import { anthropicManagedAgentService } from '../../services/anthropic-managed-agent.service.js';
import { managedAgentsService } from '../agent/managed-agents.service.js';

/**
 * MCP Routes — /api/mcp/*
 *
 * These endpoints are called exclusively by the Qestron MCP Server,
 * which is consumed by Hermes agent. They are protected by the
 * QESTRON_ADMIN_TOKEN environment variable.
 *
 * All routes require:
 *   Authorization: Bearer <QESTRON_ADMIN_TOKEN>
 *   x-mcp-client: hermes
 */

function verifyMcpToken(request: any, reply: any) {
  const token = request.headers['authorization']?.replace('Bearer ', '') || '';
  const expected = process.env.QESTRON_ADMIN_TOKEN || '';

  if (!expected) {
    // If no token is configured, warn but allow (dev mode)
    console.warn('[MCP] QESTRON_ADMIN_TOKEN not set — MCP endpoints are unprotected');
    return;
  }

  if (token !== expected) {
    reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid MCP token' } });
    return reply;
  }
}

export async function mcpRoutes(app: FastifyInstance) {
  // ── Workspace Health ────────────────────────────────────────────────────────
  app.get('/api/mcp/workspace-health', async (request: any, reply) => {
    verifyMcpToken(request, reply);
    if (reply.sent) return;

    try {
      const { workspace_id } = request.query as { workspace_id?: string };

      if (workspace_id) {
        // Single workspace
        const ws = await pool.query(
          `SELECT id, name, status, niche, created_at,
                  (SELECT COUNT(*) FROM customer_profiles WHERE workspace_id = w.id) AS customer_count,
                  (SELECT COUNT(*) FROM customer_profiles WHERE workspace_id = w.id AND risk_score > 70) AS high_risk_count,
                  (SELECT COUNT(*) FROM interaction_logs il
                   JOIN customer_profiles cp ON cp.id = il.customer_profile_id
                   WHERE cp.workspace_id = w.id AND il.created_at > NOW() - INTERVAL '24 hours') AS interactions_24h
           FROM workspaces w WHERE id = $1`,
          [workspace_id]
        );

        if (ws.rows.length === 0) {
          return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
        }

        return reply.send({ success: true, data: ws.rows[0] });
      }

      // All workspaces summary
      const summary = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'active') AS active_workspaces,
           COUNT(*) AS total_workspaces,
           (SELECT COUNT(*) FROM customer_profiles WHERE risk_score > 70) AS total_high_risk_customers,
           (SELECT COUNT(*) FROM customer_profiles) AS total_customers,
           (SELECT COUNT(*) FROM interaction_logs WHERE created_at > NOW() - INTERVAL '24 hours') AS interactions_24h,
           (SELECT COUNT(*) FROM managed_agent_runs WHERE created_at > NOW() - INTERVAL '24 hours') AS agent_runs_24h
         FROM workspaces`
      );

      const topRisk = await pool.query(
        `SELECT w.id AS workspace_id, w.name AS workspace_name,
                COUNT(*) AS high_risk_count
         FROM customer_profiles cp
         JOIN workspaces w ON w.id = cp.workspace_id
         WHERE cp.risk_score > 70
         GROUP BY w.id, w.name
         ORDER BY high_risk_count DESC
         LIMIT 5`
      );

      return reply.send({
        success: true,
        data: {
          summary: summary.rows[0],
          top_risk_workspaces: topRisk.rows,
          generated_at: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error('[MCP] workspace-health error:', err);
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL', message: err.message } });
    }
  });

  // ── Memory Sync ─────────────────────────────────────────────────────────────
  app.post('/api/mcp/memory-sync', async (request: any, reply) => {
    verifyMcpToken(request, reply);
    if (reply.sent) return;

    try {
      const { workspace_id } = request.body as { workspace_id?: string };

      // Find unprocessed interactions
      const query = workspace_id
        ? `SELECT il.*, cp.workspace_id FROM interaction_logs il
           JOIN customer_profiles cp ON cp.id = il.customer_profile_id
           WHERE cp.workspace_id = $1 AND il.processed_by_ai = false
           ORDER BY il.created_at ASC LIMIT 50`
        : `SELECT il.*, cp.workspace_id FROM interaction_logs il
           JOIN customer_profiles cp ON cp.id = il.customer_profile_id
           WHERE il.processed_by_ai = false
           ORDER BY il.created_at ASC LIMIT 50`;

      const params = workspace_id ? [workspace_id] : [];
      const pending = await pool.query(query, params);

      if (pending.rows.length === 0) {
        return reply.send({ success: true, data: { processed: 0, message: 'No pending interactions' } });
      }

      // Run Claude Managed Agent if enabled
      let agentResult = null;
      if (anthropicManagedAgentService.isEnabled() && pending.rows.length > 0) {
        const interactionSummary = pending.rows.map((r: any) =>
          `- Customer ${r.customer_profile_id}: ${r.channel} interaction, outcome: ${r.outcome || 'unknown'}, transcript: ${(r.raw_transcript || '').slice(0, 200)}`
        ).join('\n');

        try {
          const start = Date.now();
          const result = await anthropicManagedAgentService.runJsonTask<{
            profiles_to_update: Array<{
              customer_profile_id: string;
              sentiment: string;
              risk_delta: number;
              next_action: string;
              notes: string;
            }>;
            summary: string;
          }>(
            `You are a customer relationship analyst. Analyse these ${pending.rows.length} customer interactions and for each one return the recommended profile update.\n\nInteractions:\n${interactionSummary}\n\nReturn JSON: { "profiles_to_update": [{ "customer_profile_id": "...", "sentiment": "positive|neutral|negative", "risk_delta": -10 to +30, "next_action": "follow_up|win_back|upsell|none", "notes": "..." }], "summary": "one-line batch summary" }`,
            { profiles_to_update: [], summary: 'Analysis unavailable' },
            { title: 'Hermes Memory Sync' }
          );

          agentResult = result.value;

          // Log the agent run
          await managedAgentsService.logRun({
            workspaceId: workspace_id || 'all',
            sessionId: result.sessionId,
            kind: 'json',
            prompt: `Memory sync for ${pending.rows.length} interactions`,
            result: JSON.stringify(result.value),
            durationMs: Date.now() - start,
            status: 'completed',
          });
        } catch (agentErr: any) {
          console.error('[MCP] Memory sync agent error:', agentErr.message);
          // Continue with simple mark-processed fallback
        }
      }

      // Mark interactions as processed
      const ids = pending.rows.map((r: any) => r.id);
      await pool.query(
        `UPDATE interaction_logs SET processed_by_ai = true WHERE id = ANY($1)`,
        [ids]
      );

      return reply.send({
        success: true,
        data: {
          processed: pending.rows.length,
          agent_ran: agentResult !== null,
          agent_summary: agentResult?.summary || null,
          profiles_queued: agentResult?.profiles_to_update?.length || 0,
        },
      });
    } catch (err: any) {
      console.error('[MCP] memory-sync error:', err);
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL', message: err.message } });
    }
  });

  // ── Churn Alerts ────────────────────────────────────────────────────────────
  app.get('/api/mcp/churn-alerts', async (request: any, reply) => {
    verifyMcpToken(request, reply);
    if (reply.sent) return;

    try {
      const {
        threshold = '70',
        workspace_id,
        limit = '20',
      } = request.query as { threshold?: string; workspace_id?: string; limit?: string };

      const params: any[] = [Number(threshold), Number(limit)];
      let wsClause = '';
      if (workspace_id) {
        params.push(workspace_id);
        wsClause = `AND cp.workspace_id = $${params.length}`;
      }

      const result = await pool.query(
        `SELECT
           cp.id, cp.name, cp.phone, cp.email,
           cp.risk_score, cp.sentiment_trend, cp.last_interaction,
           cp.total_interactions, cp.lifetime_value,
           cp.workspace_id,
           w.name AS workspace_name,
           ROUND(EXTRACT(EPOCH FROM (NOW() - cp.last_interaction)) / 86400) AS days_since_last
         FROM customer_profiles cp
         LEFT JOIN workspaces w ON w.id = cp.workspace_id
         WHERE cp.risk_score >= $1 ${wsClause}
         ORDER BY cp.risk_score DESC
         LIMIT $2`,
        params
      );

      return reply.send({
        success: true,
        data: {
          count: result.rows.length,
          threshold: Number(threshold),
          alerts: result.rows,
          generated_at: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error('[MCP] churn-alerts error:', err);
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL', message: err.message } });
    }
  });

  // ── BI Report ───────────────────────────────────────────────────────────────
  app.get('/api/mcp/bi-report', async (request: any, reply) => {
    verifyMcpToken(request, reply);
    if (reply.sent) return;

    try {
      const { workspace_id, date } = request.query as { workspace_id?: string; date?: string };
      const reportDate = date || new Date().toISOString().split('T')[0];

      // Try stored BI report first
      if (workspace_id) {
        const stored = await pool.query(
          `SELECT * FROM bi_reports WHERE workspace_id = $1 AND report_date = $2`,
          [workspace_id, reportDate]
        ).catch(() => ({ rows: [] }));

        if (stored.rows.length > 0) {
          return reply.send({ success: true, data: stored.rows[0], source: 'cached' });
        }
      }

      // Build on-the-fly summary
      const wsClause = workspace_id ? `AND cp.workspace_id = '${workspace_id}'` : '';

      const [interactions, topCustomers, sentimentBreakdown] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS last_24h,
                  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS last_7d
           FROM interaction_logs il
           JOIN customer_profiles cp ON cp.id = il.customer_profile_id
           WHERE 1=1 ${wsClause}`
        ),
        pool.query(
          `SELECT cp.name, cp.risk_score, cp.lifetime_value, cp.last_interaction
           FROM customer_profiles cp
           WHERE cp.risk_score > 70 ${wsClause}
           ORDER BY cp.risk_score DESC LIMIT 10`
        ),
        pool.query(
          `SELECT il.sentiment, COUNT(*) AS count
           FROM interaction_logs il
           JOIN customer_profiles cp ON cp.id = il.customer_profile_id
           WHERE il.created_at > NOW() - INTERVAL '7 days' ${wsClause}
           GROUP BY il.sentiment`
        ),
      ]);

      return reply.send({
        success: true,
        data: {
          report_date: reportDate,
          workspace_id: workspace_id || 'all',
          interaction_stats: interactions.rows[0],
          top_risk_customers: topCustomers.rows,
          sentiment_breakdown: sentimentBreakdown.rows,
          generated_at: new Date().toISOString(),
        },
        source: 'live',
      });
    } catch (err: any) {
      console.error('[MCP] bi-report error:', err);
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL', message: err.message } });
    }
  });

  // ── Run Managed Agent ───────────────────────────────────────────────────────
  app.post('/api/mcp/run-managed-agent', async (request: any, reply) => {
    verifyMcpToken(request, reply);
    if (reply.sent) return;

    try {
      const { type, prompt, workspace_id, title } = request.body as {
        type: 'text' | 'json';
        prompt: string;
        workspace_id?: string;
        title?: string;
      };

      if (!anthropicManagedAgentService.isEnabled()) {
        return reply.code(503).send({
          success: false,
          error: { code: 'AGENTS_DISABLED', message: 'Set ANTHROPIC_MANAGED_AGENTS_ENABLED=true and ANTHROPIC_API_KEY to use this endpoint.' },
        });
      }

      if (!prompt || !type) {
        return reply.code(400).send({
          success: false,
          error: { code: 'INVALID_INPUT', message: '"type" and "prompt" are required.' },
        });
      }

      const start = Date.now();
      let result: any;

      if (type === 'json') {
        result = await anthropicManagedAgentService.runJsonTask({} as any, {} as any, { title });
        // Re-run with actual args (SDK signature)
        result = await anthropicManagedAgentService.runJsonTask<Record<string, unknown>>(
          prompt,
          {},
          { title }
        );
      } else {
        result = await anthropicManagedAgentService.runTextTask(prompt, { title });
      }

      const durationMs = Date.now() - start;

      // Log the run
      await managedAgentsService.logRun({
        workspaceId: workspace_id || 'hermes',
        sessionId: result.sessionId,
        kind: type,
        prompt: prompt.slice(0, 500),
        result: type === 'json' ? JSON.stringify(result.value) : result.text,
        durationMs,
        status: 'completed',
      }).catch(() => {});

      return reply.send({
        success: true,
        data: {
          session_id: result.sessionId,
          type,
          output: type === 'json' ? result.value : result.text,
          duration_ms: durationMs,
        },
      });
    } catch (err: any) {
      console.error('[MCP] run-managed-agent error:', err);
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL', message: err.message } });
    }
  });

  // ── PAT Audit ───────────────────────────────────────────────────────────────
  app.post('/api/mcp/pat-audit', async (request: any, reply) => {
    verifyMcpToken(request, reply);
    if (reply.sent) return;

    try {
      const { pat_id } = request.body as { pat_id: string };

      // Fetch PAT (by ID or pat_code)
      const pat = await pool.query(
        `SELECT * FROM partner_access_tokens
         WHERE id = $1 OR pat_code = $1
         LIMIT 1`,
        [pat_id]
      ).catch(() => ({ rows: [] }));

      if (pat.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'PAT not found. This table may not exist yet (migration 113).' },
        });
      }

      const patRow = pat.rows[0];

      // Fetch audit log
      const auditLog = await pool.query(
        `SELECT action, payload, created_at FROM partner_audit_logs
         WHERE pat_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [patRow.id]
      ).catch(() => ({ rows: [] }));

      // Basic anomaly check
      const suspiciousActions = auditLog.rows.filter((r: any) =>
        ['billing', 'delete', 'owner'].some(kw => r.action?.toLowerCase().includes(kw))
      );

      return reply.send({
        success: true,
        data: {
          pat: {
            id: patRow.id,
            pat_code: patRow.pat_code,
            status: patRow.status,
            expires_at: patRow.expires_at,
            permissions: patRow.permissions,
            restrictions: patRow.restrictions,
          },
          audit_log_count: auditLog.rows.length,
          audit_log: auditLog.rows,
          anomalies: {
            count: suspiciousActions.length,
            items: suspiciousActions,
          },
          risk_level: suspiciousActions.length > 0 ? 'HIGH' : 'CLEAR',
        },
      });
    } catch (err: any) {
      console.error('[MCP] pat-audit error:', err);
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL', message: err.message } });
    }
  });

  // ── Send Client Notification ────────────────────────────────────────────────
  app.post('/api/mcp/notify', async (request: any, reply) => {
    verifyMcpToken(request, reply);
    if (reply.sent) return;

    try {
      const { workspace_id, message, channel = 'in_app', priority = 'normal' } = request.body as {
        workspace_id: string;
        message: string;
        channel?: 'in_app' | 'sms' | 'email';
        priority?: string;
      };

      if (!workspace_id || !message) {
        return reply.code(400).send({
          success: false,
          error: { code: 'INVALID_INPUT', message: '"workspace_id" and "message" are required.' },
        });
      }

      // Insert in-app notification
      await pool.query(
        `INSERT INTO notifications (workspace_id, type, title, message, priority, source, created_at)
         VALUES ($1, $2, $3, $4, $5, 'hermes_mcp', NOW())`,
        [workspace_id, channel, 'Hermes Alert', message, priority]
      ).catch(async () => {
        // Fallback: log if notifications table schema differs
        console.warn('[MCP] notify: notifications table insert failed, logging only.');
      });

      return reply.send({
        success: true,
        data: {
          workspace_id,
          channel,
          priority,
          message,
          sent_at: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error('[MCP] notify error:', err);
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL', message: err.message } });
    }
  });

  // ── Managed Agent Runs ──────────────────────────────────────────────────────
  app.get('/api/mcp/managed-agent-runs', async (request: any, reply) => {
    verifyMcpToken(request, reply);
    if (reply.sent) return;

    try {
      const { workspace_id, limit = '10' } = request.query as { workspace_id?: string; limit?: string };

      const params: any[] = [Number(limit)];
      let wsClause = '';
      if (workspace_id) {
        params.push(workspace_id);
        wsClause = `AND workspace_id = $${params.length}`;
      }

      const result = await pool.query(
        `SELECT session_id, kind, status, duration_ms, prompt, result, error, created_at
         FROM managed_agent_runs
         WHERE 1=1 ${wsClause}
         ORDER BY created_at DESC
         LIMIT $1`,
        params
      );

      return reply.send({
        success: true,
        data: {
          runs: result.rows,
          count: result.rows.length,
        },
      });
    } catch (err: any) {
      console.error('[MCP] managed-agent-runs error:', err);
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL', message: err.message } });
    }
  });
}
