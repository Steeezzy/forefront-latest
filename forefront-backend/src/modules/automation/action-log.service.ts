import { pool } from '../../config/db.js';

interface AutomationActionLogInput {
    workspaceId: string;
    agentId?: string | null;
    sessionId?: string | null;
    ruleId?: string | null;
    actionType: string;
    status: 'sent' | 'success' | 'failed' | 'needs_setup' | 'skipped';
    payload?: Record<string, unknown>;
    errorMessage?: string | null;
}

interface BufferedActionLog {
    workspaceId: string;
    agentId: string | null;
    sessionId: string | null;
    ruleId: string | null;
    actionType: string;
    status: AutomationActionLogInput['status'];
    payload: string;
    errorMessage: string | null;
}

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_FLUSH_INTERVAL_MS = 75;

const ACTION_LOG_BATCH_SIZE = normalizeEnvInt(
    process.env.AUTOMATION_ACTION_LOG_BATCH_SIZE,
    DEFAULT_BATCH_SIZE,
    1,
    500
);
const ACTION_LOG_FLUSH_INTERVAL_MS = normalizeEnvInt(
    process.env.AUTOMATION_ACTION_LOG_FLUSH_INTERVAL_MS,
    DEFAULT_FLUSH_INTERVAL_MS,
    10,
    5_000
);

const bufferedLogs: BufferedActionLog[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let inFlightFlush: Promise<void> | null = null;
let processHookRegistered = false;

function normalizeEnvInt(value: string | undefined, fallback: number, min: number, max: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function toBufferedLog(input: AutomationActionLogInput): BufferedActionLog {
    return {
        workspaceId: input.workspaceId,
        agentId: input.agentId || null,
        sessionId: input.sessionId || null,
        ruleId: input.ruleId || null,
        actionType: input.actionType,
        status: input.status,
        payload: JSON.stringify(input.payload || {}),
        errorMessage: input.errorMessage || null,
    };
}

function scheduleFlush() {
    if (flushTimer) {
        return;
    }

    flushTimer = setTimeout(() => {
        flushTimer = null;
        void flushActionLogs();
    }, ACTION_LOG_FLUSH_INTERVAL_MS);
}

function buildBulkInsert(rows: BufferedActionLog[]) {
    const values: string[] = [];
    const params: Array<string | null> = [];

    rows.forEach((row, index) => {
        const base = index * 8;
        values.push(
            `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}::jsonb, $${base + 8})`
        );
        params.push(
            row.workspaceId,
            row.agentId,
            row.sessionId,
            row.ruleId,
            row.actionType,
            row.status,
            row.payload,
            row.errorMessage
        );
    });

    return {
        sql: `INSERT INTO automation_action_logs (
            workspace_id, agent_id, session_id, rule_id, action_type, status, payload, error_message
          ) VALUES ${values.join(', ')}`,
        params,
    };
}

async function flushActionLogs(): Promise<void> {
    if (inFlightFlush) {
        await inFlightFlush;
        return;
    }

    if (bufferedLogs.length === 0) {
        return;
    }

    const batch = bufferedLogs.splice(0, ACTION_LOG_BATCH_SIZE);

    inFlightFlush = (async () => {
        try {
            const { sql, params } = buildBulkInsert(batch);
            await pool.query(sql, params);
        } catch (error: any) {
            bufferedLogs.unshift(...batch);
            console.error('[Automation] Failed to persist action log batch:', error.message);
        } finally {
            inFlightFlush = null;
            if (bufferedLogs.length > 0) {
                scheduleFlush();
            }
        }
    })();

    await inFlightFlush;
}

function ensureProcessFlushHook() {
    if (processHookRegistered) {
        return;
    }

    processHookRegistered = true;
    process.once('beforeExit', () => {
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
        }

        void flushActionLogs();
    });
}

export async function logAutomationAction(input: AutomationActionLogInput): Promise<void> {
    try {
        ensureProcessFlushHook();

        bufferedLogs.push(toBufferedLog(input));

        if (bufferedLogs.length >= ACTION_LOG_BATCH_SIZE) {
            await flushActionLogs();
            return;
        }

        scheduleFlush();
    } catch (error: any) {
        console.error('[Automation] Failed to persist action log:', error.message);
    }
}
