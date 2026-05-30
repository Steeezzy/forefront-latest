import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool, query } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';

export async function analyticsRoutes(fastify: FastifyInstance) {
  // All analytics routes require authentication
  fastify.addHook('onRequest', authenticate);
  
  // Overview stats
  fastify.get('/overview', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const queryParams = request.query as Record<string, string>;
      const from = queryParams.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const to = queryParams.to || new Date().toISOString().split('T')[0];
      
      // Get daily aggregates
      const dailyResult = await query(
        `SELECT 
          SUM(total_conversations) as total_conversations,
          SUM(ai_conversations) as ai_conversations,
          SUM(human_conversations) as human_conversations,
          AVG(avg_first_response_seconds) as avg_first_response_seconds,
          AVG(avg_resolution_seconds) as avg_resolution_seconds,
          AVG(avg_csat) as avg_csat,
          SUM(ai_resolutions) as ai_resolutions,
          SUM(escalations) as escalations,
          SUM(leads_captured) as leads_captured
         FROM daily_aggregates
         WHERE workspace_id = $1 AND date >= $2 AND date <= $3`,
        [workspaceId, from, to]
      );
      
      // Get time series data
      const timeSeriesResult = await query(
        `SELECT 
          date,
          total_conversations,
          ai_resolutions,
          escalations
         FROM daily_aggregates
         WHERE workspace_id = $1 AND date >= $2 AND date <= $3
         ORDER BY date ASC`,
        [workspaceId, from, to]
      );
      
      return reply.send({
        success: true,
        data: {
          summary: dailyResult.rows[0],
          timeSeries: timeSeriesResult.rows,
        },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // AI Support stats
  fastify.get('/ai-support', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      // Get AI resolution rate
      const resolutionResult = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE ai_resolved = true) as ai_resolved
         FROM conversation_metrics
         WHERE workspace_id = $1`,
        [workspaceId]
      );
      
      // Get escalation reasons
      const escalationResult = await query(
        `SELECT 
          reason,
          COUNT(*) as count
         FROM ai_escalations
         WHERE workspace_id = $1
         GROUP BY reason
         ORDER BY count DESC`,
        [workspaceId]
      );
      
      // Get top unanswered questions
      const unansweredResult = await query(
        `SELECT 
          question,
          frequency,
          ai_confidence
         FROM unanswered_questions
         WHERE workspace_id = $1 AND resolved = false
         ORDER BY frequency DESC
         LIMIT 10`,
        [workspaceId]
      );
      
      return reply.send({
        success: true,
        data: {
          resolutionRate: resolutionResult.rows[0],
          escalations: escalationResult.rows,
          unansweredQuestions: unansweredResult.rows,
        },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Human Support (Agent performance)
  fastify.get('/human-support', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const result = await query(
        `SELECT 
          u.id,
          u.name,
          u.avatar_url,
          COUNT(cm.id) as conversations_handled,
          AVG(cm.first_response_time_seconds) as avg_first_response,
          AVG(cm.resolution_time_seconds) as avg_resolution,
          AVG(cm.csat_rating) as avg_csat
         FROM users u
         LEFT JOIN conversation_metrics cm ON cm.resolved_by = u.id AND cm.workspace_id = $1
         WHERE EXISTS (
           SELECT 1 FROM workspace_members wm 
           WHERE wm.user_id = u.id AND wm.workspace_id = $1
         )
         GROUP BY u.id, u.name, u.avatar_url
         ORDER BY conversations_handled DESC`,
        [workspaceId]
      );
      
      return reply.send({
        success: true,
        data: result.rows,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Export data
  fastify.get('/export', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const queryParams = request.query as Record<string, string>;
      const type = queryParams.type || 'conversations';
      const from = queryParams.from;
      const to = queryParams.to;
      
      let data: any[] = [];
      
      if (type === 'conversations') {
        const result = await query(
          `SELECT 
            c.id,
            c.visitor_name,
            c.visitor_email,
            c.channel,
            c.status,
            c.priority,
            c.created_at,
            c.closed_at,
            u.name as assigned_to
           FROM conversations c
           LEFT JOIN users u ON c.assigned_user_id = u.id
           WHERE c.workspace_id = $1
           AND ($2::date IS NULL OR c.created_at >= $2)
           AND ($3::date IS NULL OR c.created_at <= $3)
           ORDER BY c.created_at DESC`,
          [workspaceId, from || null, to || null]
        );
        data = result.rows;
      }
      
      return reply.send({
        success: true,
        data,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
}
