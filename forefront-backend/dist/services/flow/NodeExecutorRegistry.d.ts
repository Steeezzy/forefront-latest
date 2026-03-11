/**
 * NodeExecutorRegistry — maps node subtypes to executor functions
 *
 * Each executor receives the node config + flow variables and returns
 * updated variables + the ID of the next node to execute.
 *
 * @example
 * const registry = new NodeExecutorRegistry();
 * const result = await registry.execute(node, variables, context);
 */
export interface ExecutionContext {
    flow_id: string;
    execution_id: string;
    conversation_id?: string;
    visitor_id?: string;
    agent_id: string;
    workspace_id: string;
}
export interface NodeExecutionResult {
    output_variables: Record<string, any>;
    next_handle_id?: string;
    error?: string;
    tokens_used?: number;
    cost_usd?: number;
    duration_ms?: number;
}
export type NodeExecutor = (config: Record<string, any>, variables: Record<string, any>, context: ExecutionContext) => Promise<NodeExecutionResult>;
export declare class NodeExecutorRegistry {
    private executors;
    constructor();
    register(subtype: string, executor: NodeExecutor): void;
    execute(subtype: string, config: Record<string, any>, variables: Record<string, any>, context: ExecutionContext): Promise<NodeExecutionResult>;
    private registerBuiltinExecutors;
    /**
     * Replace {{variable}} placeholders with actual values
     */
    private interpolate;
}
//# sourceMappingURL=NodeExecutorRegistry.d.ts.map