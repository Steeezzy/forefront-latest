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
export declare class WorkflowScheduler {
    private intervalId;
    private checkIntervalMs;
    constructor(checkIntervalMs?: number);
    /**
     * Start the scheduler loop.
     */
    start(): void;
    /**
     * Stop the scheduler.
     */
    stop(): void;
    /**
     * Check for idle conversations and tickets, and fire matching workflows.
     */
    private runIdleChecks;
    /**
     * Find conversations that have been idle (no new messages) beyond the
     * configured threshold, and fire 'conversation_idle' workflows.
     */
    private checkIdleConversations;
    /**
     * Find tickets that have been idle beyond the configured threshold.
     */
    private checkIdleTickets;
}
export declare const workflowScheduler: WorkflowScheduler;
//# sourceMappingURL=WorkflowScheduler.d.ts.map