/**
 * ToolRegistryService — AI function-calling tool management.
 *
 * Manages global + per-workspace tools that Conversa can invoke during
 * conversations via OpenAI-compatible function calling.
 */

import { pool } from '../../config/db.js';
import { VectorSearchService } from './VectorSearchService.js';
import type {
    RegisteredTool,
    ToolParameter,
    ToolExecutionContext,
    FunctionCallResult,
} from '../../types/rag.types.js';
import { shopifyToolsService } from '../shopify/ShopifyToolsService.js';

export class ToolRegistryService {
    private globalTools: Map<string, RegisteredTool> = new Map();
    private workspaceTools: Map<string, Map<string, RegisteredTool>> = new Map();

    constructor() {
        this.registerBuiltinTools();
    }

    /**
     * Register built-in global tools.
     */
    private registerBuiltinTools() {
        // ─── Knowledge Base Search ─────────────────────────────────────
        this.register({
            name: 'search_knowledge_base',
            description: 'Search the knowledge base for relevant information to answer a customer question.',
            parameters: [
                { name: 'query', type: 'string', description: 'The search query', required: true },
                { name: 'language', type: 'string', description: 'Language filter (e.g. en, hi)', required: false },
            ],
            handler: async (args, context) => {
                const searchService = new VectorSearchService();
                const results = await searchService.searchByText(
                    context.workspace_id,
                    args.query as string,
                    { top_k: 3, min_score: 0.65 }
                );
                return results.map((r) => ({
                    title: r.document_name || 'Document',
                    excerpt: r.chunk_text.slice(0, 500),
                    score: r.score,
                }));
            },
            scope: 'global',
        });

        // ─── Shopify Tools ─────────────────────────────────────────────
        const shopifyTools = shopifyToolsService.getToolDefinitions();
        for (const st of shopifyTools) {
            this.register({
                name: st.name,
                description: st.description,
                parameters: Object.entries((st.parameters as any).properties).map(([key, prop]: [string, any]) => ({
                    name: key,
                    type: prop.type,
                    description: prop.description,
                    required: (st.parameters as any).required?.includes(key) || false,
                })),
                handler: async (args, context) => {
                    return await shopifyToolsService.executeTool(st.name, args, context.workspace_id);
                },
                scope: 'global',
            });
        }

        // ─── Create Ticket ─────────────────────────────────────────────
        this.register({
            name: 'create_ticket',
            description: 'Create a support ticket when the issue needs follow-up from a human agent.',
            parameters: [
                { name: 'subject', type: 'string', description: 'Brief ticket subject', required: true },
                { name: 'priority', type: 'string', description: 'low, normal, high, or urgent', required: false },
                { name: 'description', type: 'string', description: 'Detailed description', required: true },
            ],
            handler: async (args, context) => {
                const result = await pool.query(
                    `INSERT INTO tickets (workspace_id, subject, description, priority, source, status)
           VALUES ($1, $2, $3, $4, 'api', 'open') RETURNING id, ticket_number, status`,
                    [
                        context.workspace_id,
                        args.subject,
                        args.description,
                        args.priority || 'normal',
                    ]
                );
                return {
                    ticket_id: result.rows[0]?.id,
                    ticket_number: result.rows[0]?.ticket_number,
                    message: 'Ticket created successfully',
                };
            },
            scope: 'global',
        });

        // ─── Check Business Hours ──────────────────────────────────────
        this.register({
            name: 'check_business_hours',
            description: 'Check if the business is currently within operating hours.',
            parameters: [
                { name: 'timezone', type: 'string', description: 'IANA timezone (default: Asia/Kolkata)', required: false },
            ],
            handler: async (args) => {
                const tz = (args.timezone as string) || 'Asia/Kolkata';
                const now = new Date();
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: tz,
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: false,
                    weekday: 'long',
                });
                const parts = formatter.formatToParts(now);
                const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0');
                const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
                const isWeekend = ['Saturday', 'Sunday'].includes(weekday);
                const isBusinessHours = !isWeekend && hour >= 9 && hour < 17;

                return {
                    is_open: isBusinessHours,
                    current_time: formatter.format(now),
                    timezone: tz,
                    message: isBusinessHours
                        ? 'We are currently open and available to help.'
                        : 'We are currently outside business hours (Mon-Fri, 9 AM - 5 PM). An agent will respond when we reopen.',
                };
            },
            scope: 'global',
        });

        // ─── Send Email ────────────────────────────────────────────────
        this.register({
            name: 'send_email',
            description: 'Queue an outbound email to a customer or internal team.',
            parameters: [
                { name: 'to', type: 'string', description: 'Recipient email address', required: true },
                { name: 'subject', type: 'string', description: 'Email subject', required: true },
                { name: 'body', type: 'string', description: 'Email body text', required: true },
            ],
            handler: async (args, context) => {
                await pool.query(
                    `INSERT INTO email_queue (workspace_id, to_address, subject, body)
           VALUES ($1, $2, $3, $4)`,
                    [context.workspace_id, args.to, args.subject, args.body]
                );
                return { success: true, message: `Email queued to ${args.to}` };
            },
            scope: 'global',
        });
    }

    // ─── Public API ────────────────────────────────────────────────────

    register(tool: RegisteredTool): void {
        this.globalTools.set(tool.name, tool);
    }

    registerWorkspaceTool(tool: RegisteredTool): void {
        if (!tool.workspace_id) throw new Error('workspace_id required for workspace tools');
        if (!this.workspaceTools.has(tool.workspace_id)) {
            this.workspaceTools.set(tool.workspace_id, new Map());
        }
        this.workspaceTools.get(tool.workspace_id)!.set(tool.name, tool);
    }

    getTools(workspaceId: string): RegisteredTool[] {
        const global = Array.from(this.globalTools.values());
        const workspace = this.workspaceTools.has(workspaceId)
            ? Array.from(this.workspaceTools.get(workspaceId)!.values())
            : [];
        // Workspace tools override global tools with same name
        const merged = new Map<string, RegisteredTool>();
        for (const t of global) merged.set(t.name, t);
        for (const t of workspace) merged.set(t.name, t);
        return Array.from(merged.values());
    }

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
    }> {
        return this.getTools(workspaceId).map((tool) => ({
            type: 'function' as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: 'object',
                    properties: Object.fromEntries(
                        tool.parameters.map((p) => [
                            p.name,
                            {
                                type: p.type,
                                description: p.description,
                                ...(p.enum ? { enum: p.enum } : {}),
                            },
                        ])
                    ),
                    required: tool.parameters.filter((p) => p.required).map((p) => p.name),
                },
            },
        }));
    }

    /**
     * Execute a tool by name with error handling and timing.
     */
    async execute(
        toolName: string,
        args: Record<string, unknown>,
        context: ToolExecutionContext
    ): Promise<FunctionCallResult> {
        const startTime = Date.now();
        const tool = this.globalTools.get(toolName) ||
            this.workspaceTools.get(context.workspace_id)?.get(toolName);

        if (!tool) {
            return {
                tool_name: toolName,
                args,
                result: null,
                success: false,
                error: `Unknown tool: ${toolName}`,
                duration_ms: Date.now() - startTime,
            };
        }

        try {
            const result = await tool.handler(args, context);
            return {
                tool_name: toolName,
                args,
                result,
                success: true,
                duration_ms: Date.now() - startTime,
            };
        } catch (error: any) {
            return {
                tool_name: toolName,
                args,
                result: null,
                success: false,
                error: error.message,
                duration_ms: Date.now() - startTime,
            };
        }
    }
}

export const toolRegistryService = new ToolRegistryService();
