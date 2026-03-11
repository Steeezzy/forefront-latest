/**
 * WorkflowScheduler — Cron-based scheduler for time-dependent workflows.
 *
 * Periodically checks for idle conversations/tickets and triggers
 * the relevant workflows (auto-solve, auto-close, etc.).
 *
 * @example
 *   const scheduler = new WorkflowScheduler();
 *   scheduler.start(); // begins interval-based checks
 *   scheduler.stop();  // cleans up
 */
import { pool } from '../../config/db.js';
import { workflowEngine } from './WorkflowEngine.js';
export class WorkflowScheduler {
    intervalId = null;
    checkIntervalMs;
    constructor(checkIntervalMs = 60_000) {
        // Default: check every 60 seconds
        this.checkIntervalMs = checkIntervalMs;
    }
    /**
     * Start the scheduler loop.
     */
    start() {
        if (this.intervalId)
            return; // already running
        console.log(`[WorkflowScheduler] Started — checking every ${this.checkIntervalMs / 1000}s`);
        this.intervalId = setInterval(() => {
            this.runIdleChecks().catch((err) => console.error('[WorkflowScheduler] Error:', err.message));
        }, this.checkIntervalMs);
        // Run once immediately
        this.runIdleChecks().catch((err) => console.error('[WorkflowScheduler] Initial run error:', err.message));
    }
    /**
     * Stop the scheduler.
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('[WorkflowScheduler] Stopped');
        }
    }
    /**
     * Check for idle conversations and tickets, and fire matching workflows.
     */
    async runIdleChecks() {
        await this.checkIdleConversations();
        await this.checkIdleTickets();
    }
    /**
     * Find conversations that have been idle (no new messages) beyond the
     * configured threshold, and fire 'conversation_idle' workflows.
     */
    async checkIdleConversations() {
        try {
            // Get all workspaces that have active conversation_idle workflows
            const workflows = await pool.query(`SELECT w.*, ws.id AS wid
         FROM workflows w
         JOIN workspaces ws ON w.workspace_id = ws.id
         WHERE w.trigger_event = 'conversation_idle' AND w.is_active = true`);
            for (const wf of workflows.rows) {
                const config = wf.config || {};
                const idleMinutes = config.idle_minutes || config.idle_hours ? (config.idle_hours * 60) : 30;
                // Find conversations that are still open and have been idle
                const idleConvos = await pool.query(`SELECT c.id, c.workspace_id
           FROM conversations c
           WHERE c.workspace_id = $1
             AND c.status = 'open'
             AND c.updated_at < NOW() - INTERVAL '1 minute' * $2
             AND NOT EXISTS (
               SELECT 1 FROM workflow_executions we
               WHERE we.workflow_id = $3
                 AND we.target_id = c.id::text
                 AND we.status = 'completed'
                 AND we.executed_at > NOW() - INTERVAL '1 hour'
             )
           LIMIT 50`, [wf.workspace_id, idleMinutes, wf.id]);
                for (const convo of idleConvos.rows) {
                    await workflowEngine.processEvent(convo.workspace_id, 'conversation_idle', convo.id, { workspace_id: convo.workspace_id });
                }
            }
        }
        catch (error) {
            console.error('[WorkflowScheduler] Idle conversations check error:', error.message);
        }
    }
    /**
     * Find tickets that have been idle beyond the configured threshold.
     */
    async checkIdleTickets() {
        try {
            const workflows = await pool.query(`SELECT w.*
         FROM workflows w
         WHERE w.trigger_event = 'ticket_idle' AND w.is_active = true`);
            for (const wf of workflows.rows) {
                const config = wf.config || {};
                const idleDays = config.idle_days || 3;
                const idleTickets = await pool.query(`SELECT t.id, t.workspace_id
           FROM tickets t
           WHERE t.workspace_id = $1
             AND t.status IN ('open', 'pending')
             AND t.updated_at < NOW() - INTERVAL '1 day' * $2
             AND NOT EXISTS (
               SELECT 1 FROM workflow_executions we
               WHERE we.workflow_id = $3
                 AND we.target_id = t.id::text
                 AND we.status = 'completed'
                 AND we.executed_at > NOW() - INTERVAL '1 day'
             )
           LIMIT 50`, [wf.workspace_id, idleDays, wf.id]);
                for (const ticket of idleTickets.rows) {
                    await workflowEngine.processEvent(ticket.workspace_id, 'ticket_idle', ticket.id, { workspace_id: ticket.workspace_id });
                }
            }
        }
        catch (error) {
            console.error('[WorkflowScheduler] Idle tickets check error:', error.message);
        }
    }
}
export const workflowScheduler = new WorkflowScheduler();
//# sourceMappingURL=WorkflowScheduler.js.map