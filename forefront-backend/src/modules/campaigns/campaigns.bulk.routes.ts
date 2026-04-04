import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';
import { campaignService } from '../../services/campaign.service.js';

export async function campaignRoutes(app: FastifyInstance) {
  app.post('/:workspaceId', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const result = await campaignService.createCampaign(pool, workspaceId, request.body as any);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:workspaceId', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { status } = request.query as { status?: string };
      const values: any[] = [workspaceId];
      let query = `
        SELECT *
        FROM campaigns
        WHERE workspace_id = $1
      `;

      if (status) {
        values.push(status);
        query += ` AND status = $2`;
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, values);
      const campaigns = await Promise.all(
        result.rows.map(async (campaign) => ({
          ...campaign,
          stats: await campaignService.getCampaignStats(pool, campaign.id),
        }))
      );

      return reply.send({ campaigns });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:campaignId/status', async (request, reply) => {
    try {
      const { campaignId } = request.params as { campaignId: string };
      const result = await pool.query(
        `SELECT *
         FROM campaigns
         WHERE id = $1
         LIMIT 1`,
        [campaignId]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Campaign not found' });
      }

      return reply.send({
        campaign: result.rows[0],
        stats: await campaignService.getCampaignStats(pool, campaignId),
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.post('/:campaignId/start', async (request, reply) => {
    try {
      const { campaignId } = request.params as { campaignId: string };
      await campaignService.startCampaign(pool, campaignId);
      return reply.send({ status: 'started' });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.post('/:campaignId/pause', async (request, reply) => {
    try {
      const { campaignId } = request.params as { campaignId: string };
      await campaignService.pauseCampaign(pool, campaignId);
      return reply.send({ status: 'paused' });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.post('/:campaignId/resume', async (request, reply) => {
    try {
      const { campaignId } = request.params as { campaignId: string };
      await campaignService.resumeCampaign(pool, campaignId);
      return reply.send({ status: 'resumed' });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:campaignId/contacts', async (request, reply) => {
    try {
      const { campaignId } = request.params as { campaignId: string };
      const { status, page = '1', limit = '50' } = request.query as {
        status?: string;
        page?: string;
        limit?: string;
      };

      const safePage = Math.max(Number(page) || 1, 1);
      const safeLimit = Math.max(Number(limit) || 50, 1);
      const offset = (safePage - 1) * safeLimit;

      const values: any[] = [campaignId];
      let query = `
        SELECT *
        FROM campaign_contacts
        WHERE campaign_id = $1
      `;

      if (status) {
        values.push(status);
        query += ` AND status = $${values.length}`;
      }

      values.push(safeLimit, offset);
      query += ` ORDER BY created_at DESC NULLS LAST LIMIT $${values.length - 1} OFFSET $${values.length}`;

      const result = await pool.query(query, values);
      return reply.send({ contacts: result.rows, page: safePage, limit: safeLimit });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:campaignId/responses', async (request, reply) => {
    try {
      const { campaignId } = request.params as { campaignId: string };
      const responses = await campaignService.getResponses(pool, campaignId);
      return reply.send({ responses });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.delete('/:campaignId', async (request, reply) => {
    try {
      const { campaignId } = request.params as { campaignId: string };
      const result = await pool.query(
        `DELETE FROM campaigns
         WHERE id = $1 AND status = 'draft'
         RETURNING id`,
        [campaignId]
      );

      if (result.rows.length === 0) {
        return reply.status(400).send({ error: 'Only draft campaigns can be deleted' });
      }

      return reply.send({ deleted: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
