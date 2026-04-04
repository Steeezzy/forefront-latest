import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { env } from '../config/env.js';

// ── Queue Names ──────────────────────────────────────────────────────────
export const CAMPAIGN_DISPATCH_QUEUE = 'campaign_dispatch';
export const VOICE_POST_CALL_QUEUE = 'voice_post_call';
export const AUTOMATION_ACTIONS_QUEUE = 'automation_actions';
export const ORCHESTRATOR_QUEUE = 'orchestrator';
export const GENERAL_JOBS_QUEUE = 'general_jobs';
export const DEAD_LETTER_QUEUE = 'dead_letter';

// ── Campaign Job Payload ─────────────────────────────────────────────────
export interface CampaignJobPayload {
  campaignJobId: string;
  campaignId: string;
  customerId: string;
  workspaceId: string;
  channel: 'sms' | 'call';
}

// ── Voice Post-Call Payload ──────────────────────────────────────────────
export interface VoicePostCallJobPayload {
  callSid: string;
  sessionId?: string | null;
  workspaceId: string;
  caller?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  agentId?: string | null;
  campaignId?: string | null;
  campaignContactId?: string | null;
  campaignJobId?: string | null;
  direction?: string | null;
  transcript: string;
  callStatus: string;
  durationSeconds: number;
  language?: string | null;
  templateUsed?: string | null;
  history?: Array<{ role: string; content: string }>;
  workspaceConfig?: Record<string, any>;
}

// ── Automation Action Payload ────────────────────────────────────────────
export interface AutomationActionJobPayload {
  eventId: string;
}

// ── Orchestrator Payload ────────────────────────────────────────────────
export interface OrchestratorJobPayload {
  jobType: 'orchestrator_core' | 'campaign_dispatch';
  workspaceId: string;
  input?: {
    workspace_id: string;
    message: string;
    channel: 'voice' | 'chat' | 'whatsapp';
    customer_id?: string;
    customer_phone?: string;
    customer_name?: string;
    context?: Record<string, any>;
    ai_output?: {
      intent: string;
      entities?: Record<string, any>;
    };
  };
  campaignJob?: CampaignJobPayload;
  executionEventId?: string;
}

// ── General Jobs Payload (lead scoring, invoice reminders, review requests, etc.) ──
export type GeneralJobType =
  | 'lead_scoring'
  | 'invoice_reminder'
  | 'review_request'
  | 'data_export'
  | 'scheduled_report'
  | 'cleanup';

export interface GeneralJobPayload {
  type: GeneralJobType;
  workspaceId: string;
  data: Record<string, any>;
}

// ── Dead Letter Payload ──────────────────────────────────────────────────
export interface DeadLetterPayload {
  originalQueue: string;
  originalJobId: string;
  originalJobName: string;
  payload: Record<string, any>;
  failedReason: string;
  attemptsMade: number;
  failedAt: string;
}

// ── Redis Connection (singleton) ─────────────────────────────────────────
let connection: any = null;

function getBullConnection() {
  if (!connection) {
    connection = new (IORedis as any)(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    connection.on('error', (error: Error) => {
      console.error('[ExecutionQueues] Redis connection error:', error.message);
    });
  }

  return connection;
}

// ── Default Job Options ──────────────────────────────────────────────────
const defaultJobOptions = {
  removeOnComplete: 1000,
  removeOnFail: 1000,
};

const retriableJobOptions = {
  removeOnComplete: 1000,
  removeOnFail: 500,
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
};

// ── Connection & Queue Instances ─────────────────────────────────────────
export const redisConnection = getBullConnection();
export const bullConnection = redisConnection;

export const campaignDispatchQueue = new Queue<CampaignJobPayload>(CAMPAIGN_DISPATCH_QUEUE, {
  connection: redisConnection,
  defaultJobOptions,
});

export const voicePostCallQueue = new Queue<VoicePostCallJobPayload>(VOICE_POST_CALL_QUEUE, {
  connection: redisConnection,
  defaultJobOptions,
});

export const automationActionsQueue = new Queue<AutomationActionJobPayload>(AUTOMATION_ACTIONS_QUEUE, {
  connection: redisConnection,
  defaultJobOptions,
});

export const orchestratorQueue = new Queue<OrchestratorJobPayload>(ORCHESTRATOR_QUEUE, {
  connection: redisConnection,
  defaultJobOptions,
});

console.log('orchestratorQueue initialized');

export const generalJobsQueue = new Queue<GeneralJobPayload>(GENERAL_JOBS_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: retriableJobOptions,
});

export const deadLetterQueue = new Queue<DeadLetterPayload>(DEAD_LETTER_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 5000,
    removeOnFail: 5000,
  },
});

// ── All Queues Registry (for health checks) ──────────────────────────────
export const ALL_QUEUES = {
  [CAMPAIGN_DISPATCH_QUEUE]: campaignDispatchQueue,
  [VOICE_POST_CALL_QUEUE]: voicePostCallQueue,
  [AUTOMATION_ACTIONS_QUEUE]: automationActionsQueue,
  [ORCHESTRATOR_QUEUE]: orchestratorQueue,
  [GENERAL_JOBS_QUEUE]: generalJobsQueue,
  [DEAD_LETTER_QUEUE]: deadLetterQueue,
} as const;

// ── Queue Health Utility ─────────────────────────────────────────────────
export interface QueueHealthReport {
  queue: string;
  active: number;
  waiting: number;
  delayed: number;
  failed: number;
  completed: number;
  paused: boolean;
}

export async function getQueueHealth(): Promise<QueueHealthReport[]> {
  const reports: QueueHealthReport[] = [];

  for (const [name, queue] of Object.entries(ALL_QUEUES)) {
    try {
      const [active, waiting, delayed, failed, completed, isPaused] = await Promise.all([
        queue.getActiveCount(),
        queue.getWaitingCount(),
        queue.getDelayedCount(),
        queue.getFailedCount(),
        queue.getCompletedCount(),
        queue.isPaused(),
      ]);

      reports.push({
        queue: name,
        active,
        waiting,
        delayed,
        failed,
        completed,
        paused: isPaused,
      });
    } catch (error: any) {
      reports.push({
        queue: name,
        active: -1,
        waiting: -1,
        delayed: -1,
        failed: -1,
        completed: -1,
        paused: false,
      });
    }
  }

  return reports;
}
