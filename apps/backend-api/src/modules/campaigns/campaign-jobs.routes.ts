import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';
import { orchestratorQueue } from '../../queues/execution-queues.js';

async function resetCampaignJobForManualRetry(campaignJobId: string, queueJobId: string) {
  try {
    await pool.query(
      `UPDATE campaign_jobs
       SET status = 'queued',
           attempts = 0,
           error_message = NULL,
           failure_type = NULL,
           next_retry_at = NULL,
           completed_at = NULL,
           started_at = NULL,
           queue_job_id = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [campaignJobId, queueJobId]
    );
    return;
  } catch {
    // Fall back for older schemas that still use attempt_count and lack reliability columns.
  }

  try {
    await pool.query(
      `UPDATE campaign_jobs
       SET status = 'queued',
           attempt_count = 0,
           completed_at = NULL,
           started_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [campaignJobId]
    );
    return;
  } catch {
    // Keep one more fallback without updated_at for very old local schemas.
  }

  await pool.query(
    `UPDATE campaign_jobs
     SET status = 'queued',
         attempt_count = 0,
         completed_at = NULL,
         started_at = NULL
     WHERE id = $1`,
    [campaignJobId]
  );
}

export async function campaignJobsRoutes(app: FastifyInstance) {
  app.post('/:id/retry', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const result = await pool.query(
        `SELECT
           cj.id,
           cj.status,
           cj.campaign_id,
           cj.workspace_id,
           cj.campaign_contact_id,
            COALESCE(cj.channel, 'sms') AS channel
         FROM campaign_jobs cj
         LEFT JOIN campaigns c ON c.id = cj.campaign_id
         WHERE cj.id = $1
         LIMIT 1`,
        [id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Campaign job not found' });
      }

      const campaignJob = result.rows[0];
      if (campaignJob.status !== 'failed') {
        return reply.status(400).send({ error: 'Only failed jobs can be retried manually' });
      }

      const manualRetryJobId = `campaign-job-${campaignJob.id}-manual-${Date.now()}`;

      const queueJob = await orchestratorQueue.add(
        'execute',
        {
          jobType: 'campaign_dispatch',
          workspaceId: campaignJob.workspace_id,
          campaignJob: {
            campaignJobId: campaignJob.id,
            campaignId: campaignJob.campaign_id,
            customerId: campaignJob.campaign_contact_id,
            workspaceId: campaignJob.workspace_id,
            channel: campaignJob.channel,
          },
        },
        {
          jobId: manualRetryJobId,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 300000,
          },
        }
      );

      await resetCampaignJobForManualRetry(
        campaignJob.id,
        String(queueJob.id || manualRetryJobId)
      );

      return reply.send({
        status: 'queued',
        jobId: queueJob.id || manualRetryJobId,
        campaign_job_id: campaignJob.id,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
