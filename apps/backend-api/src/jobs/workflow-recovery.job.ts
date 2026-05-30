import cron from 'node-cron';
import { generalJobsQueue } from '../queues/execution-queues.js';

const DEFAULT_WORKFLOW_RECOVERY_CRON = process.env.WORKFLOW_RECOVERY_CRON || '*/5 * * * *';
const DEFAULT_WORKFLOW_RECOVERY_STALE_MINUTES = Number(process.env.WORKFLOW_RECOVERY_STALE_MINUTES || 15);
const DEFAULT_WORKFLOW_RECOVERY_MAX_RUNS = Number(process.env.WORKFLOW_RECOVERY_MAX_RUNS || 100);

function normalizePositiveInteger(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return Math.trunc(fallback);
  }

  return Math.trunc(value);
}

export async function enqueueWorkflowRecovery(input?: {
  staleMinutes?: number;
  maxRuns?: number;
  workspaceId?: string | null;
}) {
  const staleMinutes = normalizePositiveInteger(
    Number(input?.staleMinutes ?? DEFAULT_WORKFLOW_RECOVERY_STALE_MINUTES),
    15
  );
  const maxRuns = normalizePositiveInteger(
    Number(input?.maxRuns ?? DEFAULT_WORKFLOW_RECOVERY_MAX_RUNS),
    100
  );
  const workspaceId = String(input?.workspaceId || 'system').trim() || 'system';

  const minuteBucket = new Date().toISOString().slice(0, 16);
  const jobId = `workflow-recovery-${workspaceId}-${minuteBucket}`;

  try {
    await generalJobsQueue.add(
      'workflow-recovery',
      {
        type: 'workflow_recovery',
        workspaceId,
        data: {
          staleMinutes,
          maxRuns,
        },
      },
      { jobId }
    );
  } catch (error: any) {
    if (String(error?.message || '').toLowerCase().includes('jobid')) {
      return {
        enqueued: false,
        duplicate: true,
        workspaceId,
        staleMinutes,
        maxRuns,
      };
    }
    throw error;
  }

  return {
    enqueued: true,
    duplicate: false,
    workspaceId,
    staleMinutes,
    maxRuns,
  };
}

export function startWorkflowRecoveryCron() {
  cron.schedule(DEFAULT_WORKFLOW_RECOVERY_CRON, async () => {
    try {
      const result = await enqueueWorkflowRecovery();
      if (!result.duplicate) {
        console.log(
          `[WorkflowRecovery] Enqueued recovery job (staleMinutes=${result.staleMinutes}, maxRuns=${result.maxRuns})`
        );
      }
    } catch (error: any) {
      console.error('[WorkflowRecovery] Cron enqueue failed:', error?.message || error);
    }
  });

  console.log(`[WorkflowRecovery] Cron started (${DEFAULT_WORKFLOW_RECOVERY_CRON})`);
}
