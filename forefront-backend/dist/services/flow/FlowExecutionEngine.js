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
import { NodeExecutorRegistry } from './NodeExecutorRegistry.js';
export class FlowExecutionEngine {
    registry;
    timeoutMs;
    constructor(timeoutMs) {
        this.registry = new NodeExecutorRegistry();
        this.timeoutMs = timeoutMs || parseInt(process.env.FLOW_EXECUTION_TIMEOUT_MS || '30000');
    }
    async execute(flowId, triggerData, contextPartial) {
        const startTime = Date.now();
        // 1. Load flow from DB
        const flowResult = await pool.query(`SELECT * FROM flows WHERE id = $1`, [flowId]);
        if (flowResult.rows.length === 0) {
            throw new Error(`Flow ${flowId} not found`);
        }
        const flow = flowResult.rows[0];
        const nodes = flow.nodes || [];
        const edges = flow.edges || [];
        // 2. Create execution record
        const execResult = await pool.query(`INSERT INTO flow_executions (flow_id, conversation_id, visitor_id, status)
             VALUES ($1, $2, $3, 'running') RETURNING id`, [flowId, contextPartial.conversation_id || null, contextPartial.visitor_id || null]);
        const executionId = execResult.rows[0].id;
        const workspaceId = flow.workspace_id;
        const context = {
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
        // 4. Node-by-node traversal
        const nodeTrace = [];
        let variables = { ...triggerData };
        let totalTokens = 0;
        let totalCost = 0;
        let currentNodeId = triggerNode.id;
        const visitedNodes = new Set();
        const MAX_ITERATIONS = 100;
        let iterations = 0;
        while (currentNodeId && iterations < MAX_ITERATIONS) {
            iterations++;
            // Timeout check
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
            // Cycle detection
            const nodeVisitKey = `${currentNodeId}_${iterations}`;
            if (visitedNodes.has(currentNodeId) && iterations > nodes.length * 2) {
                break; // Prevent infinite loops
            }
            visitedNodes.add(currentNodeId);
            const currentNode = nodes.find(n => n.id === currentNodeId);
            if (!currentNode)
                break;
            const subtype = currentNode.data.subtype;
            const nodeConfig = currentNode.data.config || {};
            // Execute node
            const result = await this.registry.execute(subtype, nodeConfig, variables, context);
            // Record trace
            const trace = {
                node_id: currentNode.id,
                node_label: currentNode.data.label,
                subtype,
                status: result.error ? 'error' : 'success',
                input: this.sanitizeForTrace(variables),
                output: this.sanitizeForTrace(result.output_variables),
                duration_ms: result.duration_ms || 0,
                tokens_used: result.tokens_used || 0,
                error: result.error,
            };
            nodeTrace.push(trace);
            // Update variables
            variables = { ...variables, ...result.output_variables };
            totalTokens += result.tokens_used || 0;
            totalCost += result.cost_usd || 0;
            // If error and no error handling, stop
            if (result.error) {
                // For non-critical errors, continue; for critical, stop
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
            // Find next node via edges
            currentNodeId = this.findNextNode(currentNode.id, edges, result.next_handle_id);
        }
        // 5. Mark completed
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
    /**
     * Find the next node based on outgoing edges from the current node
     */
    findNextNode(currentNodeId, edges, handleId) {
        let matchingEdge;
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
    async updateExecution(executionId, status, nodeTrace, variables, tokens, cost, errorMessage, errorNodeId) {
        await pool.query(`UPDATE flow_executions SET
                status = $1,
                completed_at = CURRENT_TIMESTAMP,
                node_trace = $2,
                variables_snapshot = $3,
                total_tokens_used = $4,
                llm_cost_usd = $5,
                error_message = $6,
                error_node_id = $7
             WHERE id = $8`, [
            status,
            JSON.stringify(nodeTrace),
            JSON.stringify(this.sanitizeForTrace(variables)),
            tokens,
            cost,
            errorMessage || null,
            errorNodeId || null,
            executionId
        ]);
    }
    /**
     * Sanitize variables for trace storage (remove huge arrays like embeddings)
     */
    sanitizeForTrace(vars) {
        const sanitized = {};
        for (const [key, value] of Object.entries(vars)) {
            if (key === 'query_embedding' || key === 'embedding') {
                sanitized[key] = `[vector: ${Array.isArray(value) ? value.length : 0} dims]`;
            }
            else if (Array.isArray(value) && value.length > 10) {
                sanitized[key] = `[array: ${value.length} items]`;
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
}
//# sourceMappingURL=FlowExecutionEngine.js.map