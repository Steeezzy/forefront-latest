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

import { pool } from '../../config/db.js';
import { NodeExecutorRegistry, ExecutionContext, NodeExecutionResult } from './NodeExecutorRegistry.js';

interface FlowNode {
    id: string;
    type: string;
    data: {
        label: string;
        subtype: string;
        config?: Record<string, any>;
        category?: string;
    };
    position: { x: number; y: number };
}

interface FlowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
}

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
    status: 'completed' | 'failed' | 'timeout' | 'waiting';
    node_trace: NodeTrace[];
    final_variables: Record<string, any>;
    total_tokens_used: number;
    total_cost_usd: number;
    total_duration_ms: number;
    error?: string;
}

export class FlowExecutionEngine {
    private registry: NodeExecutorRegistry;
    private timeoutMs: number;

    constructor(timeoutMs?: number) {
        this.registry = new NodeExecutorRegistry();
        this.timeoutMs = timeoutMs || parseInt(process.env.FLOW_EXECUTION_TIMEOUT_MS || '30000');
    }

    async execute(
        flowId: string,
        triggerData: Record<string, any>,
        contextPartial: { agent_id: string; conversation_id?: string; visitor_id?: string }
    ): Promise<ExecutionResult> {
        const startTime = Date.now();

        // 1. Load flow from DB
        const flowResult = await pool.query(
            `SELECT f.*, a.workspace_id
             FROM flows f
             JOIN agents a ON a.id = f.agent_id
             WHERE f.id = $1`,
            [flowId]
        );
        if (flowResult.rows.length === 0) {
            throw new Error(`Flow ${flowId} not found`);
        }
        const flow = flowResult.rows[0];
        const nodes: FlowNode[] = flow.nodes || [];
        const edges: FlowEdge[] = flow.edges || [];
        const workspaceId = flow.workspace_id;

        // 2. Create execution record
        const executionId = await this.createExecutionRecord(
            flowId,
            workspaceId,
            contextPartial.conversation_id || null,
            contextPartial.visitor_id || null
        );

        const context: ExecutionContext = {
            flow_id: flowId,
            execution_id: executionId,
            workspace_id: workspaceId,
            ...contextPartial,
        };

        // 3. Find trigger node (first node of type 'flow_trigger')
        const triggerNode = nodes.find(n => n.type === 'flow_trigger');
        if (!triggerNode) {
            await this.updateExecution(executionId, 'failed', [], {}, 0, 0, 'No trigger node found');
            return {
                execution_id: executionId,
                status: 'failed',
                node_trace: [],
                final_variables: {},
                total_tokens_used: 0,
                total_cost_usd: 0,
                total_duration_ms: Date.now() - startTime,
                error: 'No trigger node found',
            };
        }

        return this.runTraversal({
            executionId,
            startTime,
            currentNodeId: triggerNode.id,
            nodes,
            edges,
            context,
            variables: { ...triggerData },
            nodeTrace: [],
            totalTokens: 0,
            totalCost: 0,
        });
    }

    async resumeExecution(
        executionId: string,
        inputData: Record<string, any>,
        contextOverrides: Partial<Pick<ExecutionContext, 'conversation_id' | 'visitor_id' | 'agent_id'>> = {}
    ): Promise<ExecutionResult> {
        const execResult = await pool.query(
            `SELECT fe.*, f.nodes, f.edges, f.agent_id, a.workspace_id
             FROM flow_executions fe
             JOIN flows f ON f.id = fe.flow_id
             JOIN agents a ON a.id = f.agent_id
             WHERE fe.id = $1
             LIMIT 1`,
            [executionId]
        );

        if (execResult.rows.length === 0) {
            throw new Error(`Execution ${executionId} not found`);
        }

        const execution = execResult.rows[0];
        const nodes: FlowNode[] = execution.nodes || [];
        const edges: FlowEdge[] = execution.edges || [];
        const storedVariables = execution.variables_snapshot || execution.data_collected || {};
        const flowState = storedVariables.__flow_state || {};
        const pendingNodeId = flowState.pending_node_id;

        if (!pendingNodeId) {
            throw new Error('This flow execution is not waiting for input');
        }

        const context: ExecutionContext = {
            flow_id: execution.flow_id,
            execution_id: executionId,
            workspace_id: execution.workspace_id,
            agent_id: contextOverrides.agent_id || execution.agent_id,
            conversation_id: contextOverrides.conversation_id || execution.conversation_id || undefined,
            visitor_id: contextOverrides.visitor_id || execution.visitor_id || undefined,
        };

        const resumedVariables = {
            ...storedVariables,
            ...inputData,
        };
        delete resumedVariables.__flow_state;
        delete resumedVariables.awaiting_response;
        delete resumedVariables.awaiting_button_click;
        delete resumedVariables.awaiting_form_submission;

        return this.runTraversal({
            executionId,
            startTime: Date.now(),
            currentNodeId: pendingNodeId,
            nodes,
            edges,
            context,
            variables: resumedVariables,
            nodeTrace: Array.isArray(execution.node_trace) ? execution.node_trace : [],
            totalTokens: Number(execution.total_tokens_used || 0),
            totalCost: Number(execution.llm_cost_usd || 0),
        });
    }

    /**
     * Find the next node based on outgoing edges from the current node
     */
    private findNextNode(currentNodeId: string, edges: FlowEdge[], handleId?: string): string | null {
        let matchingEdge: FlowEdge | undefined;

        if (handleId) {
            // For condition/fallback nodes, match specific handle
            matchingEdge = edges.find(e => e.source === currentNodeId && e.sourceHandle === handleId);
        }

        if (!matchingEdge) {
            // Default: take any outgoing edge (priority: matching handle > any)
            matchingEdge = edges.find(e => e.source === currentNodeId);
        }

        return matchingEdge?.target || null;
    }

    /**
     * Update the flow_executions record
     */
    private async updateExecution(
        executionId: string,
        status: string,
        nodeTrace: NodeTrace[],
        variables: Record<string, any>,
        tokens: number,
        cost: number,
        errorMessage?: string,
        errorNodeId?: string
    ) {
        const sanitizedVariables = this.sanitizeForTrace(variables);
        const completedAt = status === 'waiting' ? null : 'CURRENT_TIMESTAMP';

        try {
            await pool.query(
                `UPDATE flow_executions SET
                    status = $1,
                    completed_at = ${completedAt},
                    node_trace = $2,
                    variables_snapshot = $3,
                    total_tokens_used = $4,
                    llm_cost_usd = $5,
                    error_message = $6,
                    error_node_id = $7
                 WHERE id = $8`,
                [
                    status,
                    JSON.stringify(nodeTrace),
                    JSON.stringify(sanitizedVariables),
                    tokens,
                    cost,
                    errorMessage || null,
                    errorNodeId || null,
                    executionId
                ]
            );
        } catch {
            await pool.query(
                `UPDATE flow_executions SET
                    status = $1,
                    completed_at = ${completedAt},
                    nodes_visited = $2,
                    data_collected = $3,
                    execution_time_ms = COALESCE(execution_time_ms, 0)
                 WHERE id = $4`,
                [
                    status,
                    nodeTrace.map((trace) => trace.node_id),
                    JSON.stringify(sanitizedVariables),
                    executionId,
                ]
            );
        }
    }

    /**
     * Sanitize variables for trace storage (remove huge arrays like embeddings)
     */
    private sanitizeForTrace(vars: Record<string, any>): Record<string, any> {
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(vars)) {
            if (key === 'query_embedding' || key === 'embedding') {
                sanitized[key] = `[vector: ${Array.isArray(value) ? value.length : 0} dims]`;
            } else if (Array.isArray(value) && value.length > 10) {
                sanitized[key] = `[array: ${value.length} items]`;
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    private async createExecutionRecord(
        flowId: string,
        workspaceId: string,
        conversationId: string | null,
        visitorId: string | null
    ) {
        try {
            const execResult = await pool.query(
                `INSERT INTO flow_executions (flow_id, workspace_id, conversation_id, visitor_id, status)
                 VALUES ($1, $2, $3, $4, 'running')
                 RETURNING id`,
                [flowId, workspaceId, conversationId, visitorId]
            );
            return execResult.rows[0].id as string;
        } catch {
            const execResult = await pool.query(
                `INSERT INTO flow_executions (flow_id, conversation_id, visitor_id, status)
                 VALUES ($1, $2, $3, 'running')
                 RETURNING id`,
                [flowId, conversationId, visitorId]
            );
            return execResult.rows[0].id as string;
        }
    }

    private async runTraversal({
        executionId,
        startTime,
        currentNodeId,
        nodes,
        edges,
        context,
        variables,
        nodeTrace,
        totalTokens,
        totalCost,
    }: {
        executionId: string;
        startTime: number;
        currentNodeId: string | null;
        nodes: FlowNode[];
        edges: FlowEdge[];
        context: ExecutionContext;
        variables: Record<string, any>;
        nodeTrace: NodeTrace[];
        totalTokens: number;
        totalCost: number;
    }): Promise<ExecutionResult> {
        const visitedNodes = new Set<string>();
        const maxIterations = 100;
        let iterations = 0;

        while (currentNodeId && iterations < maxIterations) {
            iterations++;

            if (Date.now() - startTime > this.timeoutMs) {
                await this.updateExecution(executionId, 'timeout', nodeTrace, variables, totalTokens, totalCost, 'Execution timed out', currentNodeId);
                return {
                    execution_id: executionId,
                    status: 'timeout',
                    node_trace: nodeTrace,
                    final_variables: variables,
                    total_tokens_used: totalTokens,
                    total_cost_usd: totalCost,
                    total_duration_ms: Date.now() - startTime,
                    error: 'Execution timed out',
                };
            }

            if (visitedNodes.has(currentNodeId) && iterations > nodes.length * 2) {
                break;
            }
            visitedNodes.add(currentNodeId);

            const currentNode = nodes.find((node) => node.id === currentNodeId);
            if (!currentNode) break;

            const subtype = currentNode.data.subtype;
            const nodeConfig = currentNode.data.config || {};
            const result: NodeExecutionResult = await this.registry.execute(subtype, nodeConfig, variables, context);

            nodeTrace.push({
                node_id: currentNode.id,
                node_label: currentNode.data.label,
                subtype,
                status: result.error ? 'error' : 'success',
                input: this.sanitizeForTrace(variables),
                output: this.sanitizeForTrace(result.output_variables),
                duration_ms: result.duration_ms || 0,
                tokens_used: result.tokens_used || 0,
                error: result.error,
            });

            variables = { ...variables, ...result.output_variables };
            totalTokens += result.tokens_used || 0;
            totalCost += result.cost_usd || 0;

            if (result.pause_execution) {
                const pendingNodeId = this.findNextNode(currentNode.id, edges, result.next_handle_id);
                variables.__flow_state = {
                    pending_node_id: pendingNodeId,
                    wait_for: result.wait_for || 'input',
                    paused_after_node_id: currentNode.id,
                };
                await this.updateExecution(executionId, 'waiting', nodeTrace, variables, totalTokens, totalCost, undefined, pendingNodeId || undefined);
                return {
                    execution_id: executionId,
                    status: 'waiting',
                    node_trace: nodeTrace,
                    final_variables: variables,
                    total_tokens_used: totalTokens,
                    total_cost_usd: totalCost,
                    total_duration_ms: Date.now() - startTime,
                };
            }

            if (result.error) {
                const isCritical = subtype === 'llm_call' || subtype === 'api_call';
                if (isCritical) {
                    await this.updateExecution(executionId, 'failed', nodeTrace, variables, totalTokens, totalCost, result.error, currentNode.id);
                    return {
                        execution_id: executionId,
                        status: 'failed',
                        node_trace: nodeTrace,
                        final_variables: variables,
                        total_tokens_used: totalTokens,
                        total_cost_usd: totalCost,
                        total_duration_ms: Date.now() - startTime,
                        error: result.error,
                    };
                }
            }

            currentNodeId = this.findNextNode(currentNode.id, edges, result.next_handle_id);
        }

        await this.updateExecution(executionId, 'completed', nodeTrace, variables, totalTokens, totalCost);

        return {
            execution_id: executionId,
            status: 'completed',
            node_trace: nodeTrace,
            final_variables: variables,
            total_tokens_used: totalTokens,
            total_cost_usd: totalCost,
            total_duration_ms: Date.now() - startTime,
        };
    }
}
