import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { pool } from '../../config/db.js';
import { ivrService } from '../../services/ivr.service.js';

export async function ivrRoutes(app: FastifyInstance) {
  app.get('/:workspaceId', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const menu = await ivrService.getMenu(pool, workspaceId);
      if (!menu) {
        return reply.send({ enabled: false });
      }
      return reply.send(menu);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.put('/:workspaceId', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const {
        greetingMessage,
        options,
        timeoutSeconds,
        maxRetries,
        timeoutAction,
        enabled,
      } = request.body as any;

      const existing = await pool.query(
        `SELECT id
         FROM ivr_menus
         WHERE workspace_id = $1
         LIMIT 1`,
        [workspaceId]
      );

      if (existing.rows[0]) {
        await pool.query(
          `UPDATE ivr_menus
           SET greeting_message = $1,
               options = $2,
               timeout_seconds = $3,
               max_retries = $4,
               timeout_action = $5,
               enabled = $6,
               updated_at = NOW()
           WHERE workspace_id = $7`,
          [
            greetingMessage,
            JSON.stringify(options || []),
            timeoutSeconds ?? 5,
            maxRetries ?? 3,
            timeoutAction || 'ai_conversation',
            enabled ?? false,
            workspaceId,
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO ivr_menus (
             id,
             workspace_id,
             greeting_message,
             options,
             timeout_seconds,
             max_retries,
             timeout_action,
             enabled
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            randomUUID(),
            workspaceId,
            greetingMessage,
            JSON.stringify(options || []),
            timeoutSeconds ?? 5,
            maxRetries ?? 3,
            timeoutAction || 'ai_conversation',
            enabled ?? false,
          ]
        );
      }

      return reply.send({ updated: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.post('/:workspaceId/test', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const menu = await ivrService.getMenu(pool, workspaceId);
      if (!menu) {
        return reply.send({ enabled: false, twiml: '<Response><Say>IVR not configured</Say></Response>' });
      }

      return reply.send({
        enabled: menu.enabled,
        twiml: ivrService.generateGatherTwiML(menu),
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.post('/:workspaceId/options/add', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { digit, label, action, target, context } = request.body as any;
      const menu = await ivrService.getMenu(pool, workspaceId);

      if (!menu) {
        return reply.status(404).send({ error: 'IVR menu not configured' });
      }

      const options = Array.isArray(menu.options) ? [...menu.options] : [];
      const nextOptions = options.filter((option: any) => option.digit !== digit);
      nextOptions.push({ digit, label, action, target, context });

      await pool.query(
        `UPDATE ivr_menus
         SET options = $1, updated_at = NOW()
         WHERE workspace_id = $2`,
        [JSON.stringify(nextOptions), workspaceId]
      );

      return reply.send({ updated: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.delete('/:workspaceId/options/:digit', async (request, reply) => {
    try {
      const { workspaceId, digit } = request.params as { workspaceId: string; digit: string };
      const menu = await ivrService.getMenu(pool, workspaceId);

      if (!menu) {
        return reply.status(404).send({ error: 'IVR menu not configured' });
      }

      const nextOptions = (Array.isArray(menu.options) ? menu.options : []).filter(
        (option: any) => option.digit !== digit
      );

      await pool.query(
        `UPDATE ivr_menus
         SET options = $1, updated_at = NOW()
         WHERE workspace_id = $2`,
        [JSON.stringify(nextOptions), workspaceId]
      );

      return reply.send({ deleted: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
