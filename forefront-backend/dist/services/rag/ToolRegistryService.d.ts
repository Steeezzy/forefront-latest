/**
 * ToolRegistryService — AI function-calling tool management.
 *
 * Manages global + per-workspace tools that Lyro can invoke during
 * conversations via OpenAI-compatible function calling.
 */
import type { RegisteredTool, ToolExecutionContext, FunctionCallResult } from '../../types/rag.types.js';
export declare class ToolRegistryService {
    private globalTools;
    private workspaceTools;
    constructor();
    /**
     * Register built-in global tools.
     */
    private registerBuiltinTools;
    register(tool: RegisteredTool): void;
    registerWorkspaceTool(tool: RegisteredTool): void;
    getTools(workspaceId: string): RegisteredTool[];
    /**
     * Format tools for OpenAI function calling spec.
     */
    getOpenAIToolSchema(workspaceId: string): Array<{
        type: 'function';
        function: {
            name: string;
            description: string;
            parameters: {
                type: 'object';
                properties: Record<string, any>;
                required: string[];
            };
        };
    }>;
    /**
     * Execute a tool by name with error handling and timing.
     */
    execute(toolName: string, args: Record<string, unknown>, context: ToolExecutionContext): Promise<FunctionCallResult>;
}
export declare const toolRegistryService: ToolRegistryService;
//# sourceMappingURL=ToolRegistryService.d.ts.map