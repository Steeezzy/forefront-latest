import cron from 'node-cron';
import { campaignService } from '../services/campaign.service.js';
import { orchestratorQueue } from '../queues/execution-queues.js';

let campaignWorkerStarted = false;

export function startCampaignWorker(getDb: () => any, twilioService: any) {
  if (campaignWorkerStarted) {
    return;
  }

  campaignWorkerStarted = true;

  cron.schedule('*/1 * * * *', async () => {
    const startedAt = Date.now();
    const db = getDb();

    try {
      const scheduledCampaigns = await db.query(
        `SELECT id
         FROM campaigns
         WHERE status = 'draft'
           AND scheduled_at IS NOT NULL
           AND scheduled_at <= NOW()
         ORDER BY scheduled_at ASC`
      );

      for (const campaign of scheduledCampaigns.rows) {
        try {
          await campaignService.queueCampaignLaunch(db, campaign.id);
        } catch (error) {
          console.error(`[CampaignWorker] Failed to queue scheduled campaign ${campaign.id}:`, error);
        }
      }

      const dueQueuedJobs = await db.query(
        `SELECT cj.id,
                cj.campaign_id,
                cj.customer_id,
                cj.workspace_id,
                COALESCE(c.channel, 'call') AS channel
         FROM campaign_jobs cj
         LEFT JOIN campaigns c ON c.id = cj.campaign_id
         WHERE cj.status IN ('queued', 'retry_scheduled')
         ORDER BY cj.created_at ASC
         LIMIT 250`
      );

      for (const queuedJob of dueQueuedJobs.rows) {
        const queueJob = await orchestratorQueue.add(
          'execute',
          {
            workspaceId: queuedJob.workspace_id,
            jobType: 'campaign_dispatch',
            campaignJob: {
              campaignJobId: queuedJob.id,
              campaignId: queuedJob.campaign_id,
              customerId: queuedJob.customer_id,
              workspaceId: queuedJob.workspace_id,
              channel: queuedJob.channel,
            },
          },
          {
            jobId: `campaign-job-${queuedJob.id}`,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 300000,
            },
          }
        );

        try {
          await db.query(
            `UPDATE campaign_jobs
             SET queue_job_id = $2,
                 updated_at = NOW()
             WHERE id = $1`,
            [queuedJob.id, String(queueJob.id || '')]
          );
        } catch {
          // queue_job_id column may not exist until reliability migration is applied.
        }
      }

      const activeCampaigns = await db.query(
        `SELECT c.id
         FROM campaigns c
         WHERE c.status IN ('active', 'running')
           AND NOT EXISTS (
             SELECT 1
             FROM campaign_jobs cj
             WHERE cj.campaign_id = c.id
           )
         ORDER BY c.started_at ASC NULLS LAST, c.created_at ASC`
      );

      for (const campaign of activeCampaigns.rows) {
        try {
          await campaignService.processNextBatch(db, campaign.id, twilioService);
        } catch (error) {
          console.error(`[CampaignWorker] Legacy campaign ${campaign.id} failed:`, error);
        }
      }

      console.log(
        `[CampaignWorker] Reconciled ${scheduledCampaigns.rows.length} scheduled campaign(s), ${dueQueuedJobs.rows.length} queued job(s), and ${activeCampaigns.rows.length} legacy active campaign(s) in ${Date.now() - startedAt}ms`
      );
    } catch (error) {
      console.error('[CampaignWorker] Execution failed:', error);
    }
  });

  console.log('[CampaignWorker] Started');
}
