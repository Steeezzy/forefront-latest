/**
 * FlowExecutionEngine — orchestrates node-by-node flow traversal
 *
 * Given a flow ID and trigger data, this engine:
 * 1. Loads the flow graph (nodes + edges)
 * 2. Starts at the trigger node
 * 3. Executes each node via NodeExecutorRegistry
 * 4. Records execution trace in flow_executions
 * 5. Handles timeouts, errors, and branching
 *
 * @example
 * const engine = new FlowExecutionEngine();
 * const result = await engine.execute(flowId, { message_text: "Hello" }, { agent_id: "..." });
 */
interface NodeTrace {
    node_id: string;
    node_label: string;
    subtype: string;
    status: 'success' | 'error' | 'skipped';
    input: Record<string, any>;
    output: Record<string, any>;
    duration_ms: number;
    tokens_used: number;
    error?: string;
}
interface ExecutionResult {
    execution_id: string;
    status: 'completed' | 'failed' | 'timeout';
    node_trace: NodeTrace[];
    final_variables: Record<string, any>;
    total_tokens_used: number;
    total_cost_usd: number;
    total_duration_ms: number;
    error?: string;
}
export declare class FlowExecutionEngine {
    private registry;
    private timeoutMs;
    constructor(timeoutMs?: number);
    execute(flowId: string, triggerData: Record<string, any>, contextPartial: {
        agent_id: string;
        conversation_id?: string;
        visitor_id?: string;
    }): Promise<ExecutionResult>;
    /**
     * Find the next node based on outgoing edges from the current node
     */
    private findNextNode;
    /**
     * Update the flow_executions record
     */
    private updateExecution;
    /**
     * Sanitize variables for trace storage (remove huge arrays like embeddings)
     */
    private sanitizeForTrace;
}
export {};
//# sourceMappingURL=FlowExecutionEngine.d.ts.map