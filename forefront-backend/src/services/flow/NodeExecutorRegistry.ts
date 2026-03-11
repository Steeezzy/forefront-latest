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

import { pool } from '../../config/db.js';
import { EmbeddingService } from '../rag/EmbeddingService.js';
import { VectorSearchService } from '../rag/VectorSearchService.js';
import { integrationEvents } from '../../modules/integrations/integration-events.service.js';

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
    next_handle_id?: string; // For condition nodes: 'true'/'false'/'has_results'/'no_results'
    error?: string;
    tokens_used?: number;
    cost_usd?: number;
    duration_ms?: number;
}

export type NodeExecutor = (
    config: Record<string, any>,
    variables: Record<string, any>,
    context: ExecutionContext
) => Promise<NodeExecutionResult>;

export class NodeExecutorRegistry {
    private executors: Map<string, NodeExecutor> = new Map();

    constructor() {
        this.registerBuiltinExecutors();
    }

    register(subtype: string, executor: NodeExecutor) {
        this.executors.set(subtype, executor);
    }

    async execute(
        subtype: string,
        config: Record<string, any>,
        variables: Record<string, any>,
        context: ExecutionContext
    ): Promise<NodeExecutionResult> {
        const executor = this.executors.get(subtype);
        if (!executor) {
            return {
                output_variables: {},
                error: `No executor registered for node subtype: ${subtype}`,
            };
        }

        const startTime = Date.now();
        try {
            const result = await executor(config, variables, context);
            result.duration_ms = Date.now() - startTime;
            return result;
        } catch (error: any) {
            return {
                output_variables: {},
                error: error.message,
                duration_ms: Date.now() - startTime,
            };
        }
    }

    private registerBuiltinExecutors() {
        // ===== TRIGGERS (pass-through, just provide initial variables) =====
        const triggerPassthrough: NodeExecutor = async (config, variables) => ({
            output_variables: { ...variables },
        });
        ['first_visit', 'visitor_returns', 'visitor_opens_page', 'visitor_scrolls',
            'visitor_clicks_chat', 'visitor_says', 'new_event', 'form_abandoned',
            'mouse_leaves', 'idle_visitor', 'schedule', 'agent_no_respond',
            'agent_starts_flow', 'from_another_flow', 'visitor_selects_dept'
        ].forEach(t => this.register(t, triggerPassthrough));

        // ===== ACTIONS =====

        // Send a chat message
        this.register('send_message', async (config, variables) => {
            const message = this.interpolate(config.message || '', variables);
            return {
                output_variables: { ...variables, message_id: `msg_${Date.now()}`, last_message: message },
            };
        });

        // Ask a question
        this.register('ask_question', async (config, variables) => {
            const question = this.interpolate(config.question || '', variables);
            return {
                output_variables: { ...variables, pending_question: question, awaiting_response: true },
            };
        });

        // Delay
        this.register('delay', async (config, variables) => {
            const ms = (config.duration || 1) * (config.unit === 'minutes' ? 60000 : config.unit === 'hours' ? 3600000 : 1000);
            await new Promise(resolve => setTimeout(resolve, Math.min(ms, 30000))); // Cap at 30s for safety
            return { output_variables: { ...variables } };
        });

        // Update contact property
        this.register('update_contact', async (config, variables) => {
            const value = this.interpolate(config.value || '', variables);
            return {
                output_variables: { ...variables, [config.property || 'contact_update']: value },
            };
        });

        // Update session variable
        this.register('update_session_var', async (config, variables) => {
            const value = this.interpolate(config.value || '', variables);
            return {
                output_variables: { ...variables, [config.variable_name || 'custom_var']: value },
            };
        });

        // API Call
        this.register('api_call', async (config, variables) => {
            try {
                const url = this.interpolate(config.url || '', variables);
                const body = config.body ? this.interpolate(config.body, variables) : undefined;
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (config.auth_type === 'bearer' && config.auth_value) {
                    headers['Authorization'] = `Bearer ${this.interpolate(config.auth_value, variables)}`;
                }

                const resp = await fetch(url, {
                    method: config.method || 'GET',
                    headers,
                    body: config.method !== 'GET' ? body : undefined,
                });
                const responseBody = await resp.text();
                let parsed;
                try { parsed = JSON.parse(responseBody); } catch { parsed = responseBody; }

                return {
                    output_variables: {
                        ...variables,
                        [config.response_variable || 'api_response']: parsed,
                        api_status_code: resp.status,
                    },
                };
            } catch (error: any) {
                return {
                    output_variables: { ...variables, api_error: error.message },
                    error: error.message,
                };
            }
        });

        // ===== CONDITIONS =====

        // Based on variable
        this.register('based_on_variable', async (config, variables) => {
            const value = variables[config.variable_name];
            let result = false;
            switch (config.operator) {
                case 'equals': result = String(value) === String(config.value); break;
                case 'not_equals': result = String(value) !== String(config.value); break;
                case 'contains': result = String(value).includes(String(config.value)); break;
                case 'greater_than': result = Number(value) > Number(config.value); break;
                case 'less_than': result = Number(value) < Number(config.value); break;
                case 'is_set': result = value !== undefined && value !== null && value !== ''; break;
                case 'is_not_set': result = value === undefined || value === null || value === ''; break;
                default: result = false;
            }
            return {
                output_variables: { ...variables, condition_result: result },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        // ===== RAG / AI NODES =====

        // Embed Query
        this.register('embed_query', async (config, variables) => {
            const text = this.interpolate(config.input_variable || '{{message_text}}', variables);
            const embeddingService = new EmbeddingService(config.model);
            const result = await embeddingService.embedText(text);
            return {
                output_variables: { ...variables, query_embedding: result.embedding },
                tokens_used: result.tokens_used,
            };
        });

        // Vector Search
        this.register('vector_search', async (config, variables) => {
            const embedding = variables.query_embedding;
            if (!embedding) {
                return { output_variables: variables, error: 'No query_embedding found. Connect an Embed Query node first.' };
            }
            const searchService = new VectorSearchService(config.model);
            const results = await searchService.search(config.kb_id, embedding, {
                top_k: config.top_k || 5,
                min_score: config.min_score || 0.7,
            });
            return {
                output_variables: {
                    ...variables,
                    retrieved_chunks: results,
                    search_result_count: results.length,
                },
            };
        });

        // Context Builder
        this.register('context_builder', async (config, variables) => {
            const chunks = variables.retrieved_chunks || [];
            const searchService = new VectorSearchService();
            const context = searchService.buildContext(chunks, config.format || 'numbered');
            return {
                output_variables: {
                    ...variables,
                    context_string: context,
                    sources: chunks.map((c: any) => ({ document: c.document_name, score: c.score })),
                },
            };
        });

        // Fallback Handler (condition-like, 2 outputs)
        this.register('fallback_handler', async (config, variables) => {
            const count = variables.search_result_count ?? 0;
            const threshold = config.score_threshold || 0;
            const hasResults = count > threshold;
            return {
                output_variables: { ...variables, has_results: hasResults },
                next_handle_id: hasResults ? 'has_results' : 'no_results',
            };
        });

        // Prompt Template
        this.register('prompt_template', async (config, variables) => {
            const systemPrompt = this.interpolate(config.system_prompt || '', variables);
            const messages = [
                { role: 'system', content: systemPrompt },
                ...(variables.messages_array || []),
                ...(variables.pending_question
                    ? [{ role: 'user', content: variables.pending_question }]
                    : variables.message_text
                        ? [{ role: 'user', content: variables.message_text }]
                        : []),
            ];
            return {
                output_variables: { ...variables, messages: messages },
            };
        });

        // LLM Call
        this.register('llm_call', async (config, variables) => {
            const messages = variables.messages || [];
            if (messages.length === 0) {
                return { output_variables: variables, error: 'No messages found. Connect a Prompt Template node first.' };
            }

            try {
                // Use Sarvam AI as primary (per user rules), fall back to OpenAI
                const apiKey = process.env.SARVAM_API_KEY || process.env.OPENAI_API_KEY;
                const baseUrl = process.env.SARVAM_API_KEY
                    ? 'https://api.sarvam.ai/v1/chat/completions'
                    : 'https://api.openai.com/v1/chat/completions';

                const resp = await fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: config.model || 'sarvam-m',
                        messages,
                        temperature: config.temperature ?? 0.3,
                        max_tokens: config.max_tokens ?? 500,
                    }),
                });

                const data = await resp.json() as any;
                const responseText = data.choices?.[0]?.message?.content || '';
                const tokensUsed = data.usage?.total_tokens || 0;

                // Rough cost estimate (GPT-4o pricing)
                const costPerToken = 0.000005;
                const cost = tokensUsed * costPerToken;

                return {
                    output_variables: {
                        ...variables,
                        response_text: responseText,
                        llm_model: config.model || 'sarvam-m',
                    },
                    tokens_used: tokensUsed,
                    cost_usd: cost,
                };
            } catch (error: any) {
                return {
                    output_variables: { ...variables },
                    error: `LLM Call failed: ${error.message}`,
                };
            }
        });

        // Output Parser
        this.register('output_parser', async (config, variables) => {
            let parsed = variables.response_text || '';
            if (config.format === 'json') {
                try {
                    const jsonMatch = parsed.match(/```json\s*([\s\S]*?)```/) || parsed.match(/\{[\s\S]*\}/);
                    parsed = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : parsed;
                } catch { /* keep raw text */ }
            }
            // Strip markdown
            parsed = String(parsed).replace(/```[\s\S]*?```/g, '').replace(/[*_~`]/g, '').trim();
            return {
                output_variables: { ...variables, parsed_output: parsed },
            };
        });

        // Session Memory Read (Redis)
        this.register('session_memory_read', async (config, variables, context) => {
            // Placeholder — will integrate with Redis in Sprint 4
            return {
                output_variables: { ...variables, session_memory: {} },
            };
        });

        // Session Memory Write (Redis)
        this.register('session_memory_write', async (config, variables, context) => {
            // Placeholder — will integrate with Redis in Sprint 4
            return {
                output_variables: { ...variables, memory_stored: true },
            };
        });

        // Long-term Memory Fetch
        this.register('longterm_memory_fetch', async (config, variables, context) => {
            try {
                const result = await pool.query(
                    `SELECT * FROM conversation_memories
                     WHERE agent_id = $1 AND visitor_id = $2
                     ORDER BY created_at DESC LIMIT $3`,
                    [context.agent_id, context.visitor_id || '', config.top_k || 5]
                );
                return {
                    output_variables: { ...variables, memories: result.rows },
                };
            } catch (error: any) {
                return { output_variables: variables, error: error.message };
            }
        });

        // Long-term Memory Store
        this.register('longterm_memory_store', async (config, variables, context) => {
            try {
                const content = this.interpolate(config.content || '', variables);
                await pool.query(
                    `INSERT INTO conversation_memories (agent_id, visitor_id, memory_type, content, confidence)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [context.agent_id, context.visitor_id || '', config.memory_type || 'fact', content, config.confidence || 1.0]
                );
                return { output_variables: { ...variables, memory_stored: true } };
            } catch (error: any) {
                return { output_variables: variables, error: error.message };
            }
        });

        // ===== ADDITIONAL ACTION NODES =====

        // Decision Card — present clickable options to visitor
        this.register('decision_card', async (config, variables) => {
            const buttons = (config.buttons || []).map((b: any) => ({
                label: this.interpolate(b.label || '', variables),
                value: b.value || b.label,
            }));
            return {
                output_variables: {
                    ...variables,
                    decision_card: {
                        question: this.interpolate(config.question || '', variables),
                        buttons,
                    },
                    awaiting_button_click: true,
                },
            };
        });

        // Tag Management — add/remove tags on visitor or conversation
        this.register('tag_management', async (config, variables, context) => {
            const tag = this.interpolate(config.tag || '', variables);
            const action = config.action || 'add'; // 'add' | 'remove'
            try {
                if (context.conversation_id) {
                    if (action === 'add') {
                        await pool.query(
                            `UPDATE conversations SET tags = array_append(tags, $1)
                             WHERE id = $2 AND NOT ($1 = ANY(tags))`,
                            [tag, context.conversation_id]
                        );
                    } else {
                        await pool.query(
                            `UPDATE conversations SET tags = array_remove(tags, $1) WHERE id = $2`,
                            [tag, context.conversation_id]
                        );
                    }
                }
                return {
                    output_variables: { ...variables, tag_applied: tag, tag_action: action },
                };
            } catch (error: any) {
                return { output_variables: variables, error: error.message };
            }
        });

        // Assign Agent — route conversation to specific agent or department
        this.register('assign_agent', async (config, variables, context) => {
            try {
                if (context.conversation_id) {
                    const assignTo = config.agent_id || config.department_id || null;
                    await pool.query(
                        `UPDATE conversations SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                        [assignTo, context.conversation_id]
                    );
                }
                return {
                    output_variables: {
                        ...variables,
                        assigned_to: config.agent_id || config.department_id,
                        routing_method: config.method || 'direct', // direct | round_robin | least_busy
                    },
                };
            } catch (error: any) {
                return { output_variables: variables, error: error.message };
            }
        });

        // Close Conversation — mark conversation as solved/closed
        this.register('close_conversation', async (config, variables, context) => {
            try {
                if (context.conversation_id) {
                    const newStatus = config.status || 'closed';
                    await pool.query(
                        `UPDATE conversations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                        [newStatus, context.conversation_id]
                    );

                    // Fire conversation.closed event — non-blocking
                    if (newStatus === 'closed' && context.workspace_id) {
                        integrationEvents.fireEvent('conversation.closed', {
                            workspaceId: context.workspace_id,
                            conversation: {
                                id: context.conversation_id,
                            },
                        }).catch(e => console.error('[FlowEngine] Event fire error:', e.message));
                    }
                }
                return {
                    output_variables: { ...variables, conversation_closed: true },
                };
            } catch (error: any) {
                return { output_variables: variables, error: error.message };
            }
        });

        // Send Email — send an outbound email (placeholder — integrates with email service)
        this.register('send_email', async (config, variables) => {
            const to = this.interpolate(config.to || '', variables);
            const subject = this.interpolate(config.subject || '', variables);
            const body = this.interpolate(config.body || '', variables);
            // TODO: integrate with actual email service (SMTP/SES)
            console.log(`[Flow] Send email to=${to} subject="${subject}"`);
            return {
                output_variables: {
                    ...variables,
                    email_sent: true,
                    email_to: to,
                    email_subject: subject,
                },
            };
        });

        // Subscribe to Newsletter / Mailing List
        this.register('subscribe_newsletter', async (config, variables) => {
            const email = variables.visitor_email || this.interpolate(config.email || '', variables);
            const listName = config.list_name || 'default';
            // TODO: integrate with CRM/email marketing service
            console.log(`[Flow] Subscribe ${email} to list "${listName}"`);
            return {
                output_variables: { ...variables, subscribed: true, subscribed_email: email },
            };
        });

        // Redirect to Another Flow
        this.register('redirect_flow', async (config, variables) => {
            return {
                output_variables: {
                    ...variables,
                    redirect_to_flow_id: config.target_flow_id,
                    should_redirect: true,
                },
            };
        });

        // ===== ADDITIONAL CONDITION NODES =====

        // Visitor Property Condition — evaluate browser, OS, device, language
        this.register('visitor_property', async (config, variables) => {
            const property = config.property; // browser, os, device_type, language, is_returning
            const value = variables[property] || variables[`visitor_${property}`] || '';
            let result = false;

            switch (config.operator) {
                case 'equals': result = String(value).toLowerCase() === String(config.value).toLowerCase(); break;
                case 'not_equals': result = String(value).toLowerCase() !== String(config.value).toLowerCase(); break;
                case 'contains': result = String(value).toLowerCase().includes(String(config.value).toLowerCase()); break;
                case 'is_mobile': result = String(value).toLowerCase() === 'mobile'; break;
                case 'is_desktop': result = String(value).toLowerCase() === 'desktop'; break;
                case 'is_returning': result = variables.is_returning === true; break;
                default: result = false;
            }

            return {
                output_variables: { ...variables, visitor_condition_result: result },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        // Cart Value Condition — for e-commerce triggers
        this.register('cart_condition', async (config, variables) => {
            const cartValue = Number(variables.cart_total || variables.cart_value || 0);
            const threshold = Number(config.threshold || 0);
            let result = false;
            switch (config.operator) {
                case 'greater_than': result = cartValue > threshold; break;
                case 'less_than': result = cartValue < threshold; break;
                case 'equals': result = cartValue === threshold; break;
                case 'greater_or_equal': result = cartValue >= threshold; break;
                default: result = false;
            }
            return {
                output_variables: { ...variables, cart_condition_result: result, cart_total: cartValue },
                next_handle_id: result ? 'true' : 'false',
            };
        });
    }

    /**
     * Replace {{variable}} placeholders with actual values
     */
    private interpolate(template: string, variables: Record<string, any>): string {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
            const val = variables[key];
            if (val === undefined || val === null) return '';
            return typeof val === 'object' ? JSON.stringify(val) : String(val);
        });
    }
}
