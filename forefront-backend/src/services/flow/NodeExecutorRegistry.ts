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
import { redis } from '../../config/redis.js';
import { EmbeddingService } from '../rag/EmbeddingService.js';
import { VectorSearchService } from '../rag/VectorSearchService.js';
import { integrationEvents } from '../../modules/integrations/integration-events.service.js';
import { shopifyToolsService } from '../shopify/ShopifyToolsService.js';
import * as vm from 'node:vm';

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
    pause_execution?: boolean;
    wait_for?: 'input' | 'button_click' | 'form_submission';
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

        // ===== COMPATIBILITY LAYER FOR CHATBOT FLOW BUILDER =====

        [
            'cart_add',
            'cart_abandoned',
            'purchase_complete',
            'page_visit',
            'exit_intent',
            'agent_unavailable',
            'no_response',
            'shopify_add_cart',
        ].forEach((subtype) => this.register(subtype, triggerPassthrough));

        this.register('ask_question', async (config, variables) => {
            const question = this.interpolate(config.question || config.message || '', variables);
            const variableName = config.variable_name || config.variable || 'response';
            return {
                output_variables: {
                    ...variables,
                    pending_question: question,
                    awaiting_response: true,
                    expected_response_variable: variableName,
                },
                pause_execution: true,
                wait_for: 'input',
            };
        });

        this.register('based_on_variable', async (config, variables) => {
            const variableName = config.variable_name || config.variable;
            const value = variables[variableName];
            const expected = this.resolveConfigValue(config, ['value', 'compare_value'], variables);
            let result = false;

            switch (config.operator) {
                case 'equals':
                case 'equal':
                    result = String(value) === String(expected);
                    break;
                case 'not_equals':
                    result = String(value) !== String(expected);
                    break;
                case 'contains':
                    result = String(value || '').includes(String(expected));
                    break;
                case 'greater_than':
                    result = Number(value) > Number(expected);
                    break;
                case 'less_than':
                    result = Number(value) < Number(expected);
                    break;
                case 'is_set':
                    result = value !== undefined && value !== null && value !== '';
                    break;
                case 'is_not_set':
                    result = value === undefined || value === null || value === '';
                    break;
                default:
                    result = false;
            }

            return {
                output_variables: { ...variables, condition_result: result, compared_variable: variableName },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        this.register('browser', async (config, variables) => {
            const actual = String(variables.browser || variables.visitor_browser || '').toLowerCase();
            const browsers = this.toStringArray(config.browsers || config.browser).map((entry) => entry.toLowerCase());
            const result = browsers.length === 0 ? Boolean(actual) : browsers.some((entry) => actual.includes(entry));
            return {
                output_variables: { ...variables, browser_condition_result: result, browser_detected: actual || null },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        this.register('operating_system', async (config, variables) => {
            const actual = String(variables.os || variables.visitor_os || '').toLowerCase();
            const targets = this.toStringArray(config.os_list || config.os || config.operating_systems).map((entry) => entry.toLowerCase());
            const result = targets.length === 0 ? Boolean(actual) : targets.some((entry) => actual.includes(entry));
            return {
                output_variables: { ...variables, os_condition_result: result, os_detected: actual || null },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        this.register('mobile', async (config, variables) => {
            const deviceType = String(variables.device_type || variables.visitor_device_type || '').toLowerCase();
            const result = deviceType === 'mobile' || deviceType === 'tablet' || variables.is_mobile === true;
            return {
                output_variables: { ...variables, mobile_condition_result: result },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        this.register('returning_visitor', async (config, variables) => {
            const result = Boolean(variables.is_returning || variables.returning_visitor);
            return {
                output_variables: { ...variables, returning_visitor_result: result },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        this.register('day', async (config, variables) => {
            const targetDays = this.toStringArray(config.days).map((entry) => entry.toLowerCase().slice(0, 3));
            const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
            const result = targetDays.length === 0 ? true : targetDays.includes(currentDay);
            return {
                output_variables: { ...variables, day_condition_result: result, current_day: currentDay },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        this.register('current_url', async (config, variables) => {
            const currentUrl = String(variables.current_url || variables.page_url || '');
            const pattern = this.resolveConfigValue(config, ['url_pattern', 'url_contains', 'pattern'], variables);
            const matchType = config.match_type || config.url_match_type || 'contains';
            const result = this.matchPattern(currentUrl, pattern, matchType);
            return {
                output_variables: { ...variables, url_condition_result: result, matched_url: currentUrl || null },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        this.register('language', async (config, variables) => {
            const actual = String(variables.language || variables.visitor_language || '').toLowerCase();
            const targets = this.toStringArray(config.languages || config.language).map((entry) => entry.toLowerCase());
            const result = targets.length === 0 ? Boolean(actual) : targets.some((entry) => actual.startsWith(entry));
            return {
                output_variables: { ...variables, language_condition_result: result, language_detected: actual || null },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        this.register('chat_status', async (config, variables) => {
            const actual = String(variables.chat_status || variables.agent_status || 'online').toLowerCase();
            const expected = String(config.status || 'online').toLowerCase();
            const result = actual === expected;
            return {
                output_variables: { ...variables, chat_status_result: result, chat_status_detected: actual },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        this.register('mailing_subscriber', async (config, variables) => {
            const result = Boolean(variables.subscribed || variables.is_mailing_subscriber || variables.marketing_subscriber);
            return {
                output_variables: { ...variables, mailing_subscriber_result: result },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        this.register('connection_channel', async (config, variables) => {
            const actual = this.normalizeChannelValue(String(variables.channel || variables.connection_channel || ''));
            const targets = this.toStringArray(config.channels || config.channel).map((entry) => this.normalizeChannelValue(entry));
            const result = targets.length === 0 ? Boolean(actual) : targets.includes(actual);
            return {
                output_variables: { ...variables, connection_channel_result: result, connection_channel_detected: actual || null },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        this.register('cart_value', async (config, variables) => {
            const actual = Number(variables.cart_total || variables.cart_value || 0);
            const threshold = Number(config.value ?? config.threshold ?? 0);
            const operator = config.operator || 'greater_than';
            let result = false;
            switch (operator) {
                case 'greater_than':
                    result = actual > threshold;
                    break;
                case 'less_than':
                    result = actual < threshold;
                    break;
                case 'equal':
                case 'equals':
                    result = actual === threshold;
                    break;
                case 'greater_or_equal':
                    result = actual >= threshold;
                    break;
                default:
                    result = false;
            }
            return {
                output_variables: { ...variables, cart_condition_result: result, cart_total: actual },
                next_handle_id: result ? 'true' : 'false',
            };
        });

        const decisionExecutor: NodeExecutor = async (config, variables) => {
            const question = this.interpolate(config.question || config.message || '', variables);
            const rawOptions = config.options || config.buttons || config.quick_replies || [];
            const options = this.toStringArray(rawOptions).map((option) => this.interpolate(option, variables));
            return {
                output_variables: {
                    ...variables,
                    decision_payload: {
                        question,
                        options,
                        presentation: config.presentation || 'buttons',
                    },
                    awaiting_button_click: true,
                },
                pause_execution: true,
                wait_for: 'button_click',
            };
        };
        this.register('decision_quick', decisionExecutor);
        this.register('decision_buttons', decisionExecutor);

        this.register('decision_cards', async (config, variables) => {
            const cards = this.parseJsonInput(config.cards, []).map((card: any) => ({
                ...card,
                title: this.interpolate(card.title || '', variables),
                subtitle: this.interpolate(card.subtitle || '', variables),
                button: this.interpolate(card.button || '', variables),
            }));
            return {
                output_variables: {
                    ...variables,
                    decision_payload: {
                        cards,
                        presentation: 'cards',
                    },
                    awaiting_button_click: true,
                },
                pause_execution: true,
                wait_for: 'button_click',
            };
        });

        this.register('decision_card', async (config, variables) => {
            const question = this.interpolate(config.question || '', variables);
            const buttons = Array.isArray(config.buttons)
                ? config.buttons.map((button: any) => ({
                    label: this.interpolate(button.label || button.title || button.value || '', variables),
                    value: button.value || button.label || button.title,
                }))
                : this.toStringArray(config.buttons || config.options).map((label) => ({
                    label: this.interpolate(label, variables),
                    value: this.interpolate(label, variables),
                }));
            return {
                output_variables: {
                    ...variables,
                    decision_payload: {
                        question,
                        options: buttons,
                        presentation: 'buttons',
                    },
                    awaiting_button_click: true,
                },
                pause_execution: true,
                wait_for: 'button_click',
            };
        });

        this.register('randomize', async (config, variables) => {
            const branchCount = Math.max(2, Number(config.branches || 2));
            const weights = this.toStringArray(config.weights)
                .map((entry) => Number(entry))
                .filter((entry) => Number.isFinite(entry) && entry > 0);
            const selectedBranch = this.pickWeightedBranch(branchCount, weights);
            return {
                output_variables: { ...variables, random_branch: selectedBranch },
                next_handle_id: `branch_${selectedBranch}`,
            };
        });

        this.register('update_contact', async (config, variables, context) => {
            const property = String(config.property || config.field || 'custom').trim();
            const value = this.resolveConfigValue(config, ['value'], variables);
            const allowedColumns = new Set(['name', 'email', 'phone', 'language', 'country', 'city', 'region', 'current_page']);

            try {
                if (context.visitor_id) {
                    if (allowedColumns.has(property)) {
                        await pool.query(
                            `UPDATE visitors
                             SET ${property} = $1, last_seen_at = CURRENT_TIMESTAMP
                             WHERE workspace_id = $2 AND visitor_id = $3`,
                            [value, context.workspace_id, context.visitor_id]
                        );
                    } else {
                        await pool.query(
                            `UPDATE visitors
                             SET custom_properties = COALESCE(custom_properties, '{}'::jsonb) || $1::jsonb,
                                 last_seen_at = CURRENT_TIMESTAMP
                             WHERE workspace_id = $2 AND visitor_id = $3`,
                            [JSON.stringify({ [property || 'custom']: value }), context.workspace_id, context.visitor_id]
                        );
                    }
                }
            } catch {
                // Visitor tracking may not be initialized in all workspaces; keep the flow running.
            }

            return {
                output_variables: { ...variables, [property || 'contact_update']: value, contact_property_updated: property },
            };
        });

        this.register('add_tag', async (config, variables, context) => {
            const tag = this.resolveConfigValue(config, ['tag_name', 'tag'], variables);
            return this.execute('tag_management', { tag, action: 'add' }, variables, context);
        });

        this.register('remove_tag', async (config, variables, context) => {
            const tag = this.resolveConfigValue(config, ['tag_name', 'tag'], variables);
            return this.execute('tag_management', { tag, action: 'remove' }, variables, context);
        });

        this.register('update_session_var', async (config, variables, context) => {
            const variableName = config.variable_name || config.variable || 'custom_var';
            const value = this.resolveConfigValue(config, ['value'], variables);

            if (context.execution_id) {
                const redisKey = `flow:session:${context.execution_id}`;
                await redis.setex(redisKey, Number(config.ttl_seconds || 86400), JSON.stringify({
                    ...(this.parseJsonInput(await redis.get(redisKey), {})),
                    [variableName]: value,
                })).catch(() => { });
            }

            return {
                output_variables: { ...variables, [variableName]: value },
            };
        });

        this.register('data_transform', async (config, variables) => {
            const source = variables[config.input_variable] ?? this.resolveConfigValue(config, ['input_variable'], variables);
            const outputVariable = config.output_variable || 'transformed_data';
            try {
                const transformed = this.evaluateExpression(config.expression || 'value', source, variables);
                return {
                    output_variables: { ...variables, [outputVariable]: transformed, transformation_applied: true },
                };
            } catch (error: any) {
                return {
                    output_variables: { ...variables, transformation_error: error.message },
                    error: error.message,
                };
            }
        });

        this.register('send_zapier', async (config, variables, context) => {
            const webhookUrl = this.resolveConfigValue(config, ['webhook_url'], variables);
            const payload = this.parseJsonInput(this.interpolate(String(config.payload || '{}'), variables), {
                variables,
                workspace_id: context.workspace_id,
                execution_id: context.execution_id,
            });

            if (!webhookUrl) {
                return { output_variables: { ...variables, zapier_sent: false }, error: 'Zapier webhook URL is required' };
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            return {
                output_variables: {
                    ...variables,
                    zapier_sent: response.ok,
                    zapier_status_code: response.status,
                },
                error: response.ok ? undefined : `Zapier webhook failed with status ${response.status}`,
            };
        });

        this.register('send_ga_event', async (config, variables, context) => {
            const eventName = this.resolveConfigValue(config, ['event_name'], variables);
            const eventParams = this.parseJsonInput(config.event_params, {});
            await integrationEvents.fireEvent('conversation.started', {
                workspaceId: context.workspace_id,
                customFields: {
                    ga_event_name: eventName,
                    ...eventParams,
                },
            }).catch(() => { });

            return {
                output_variables: { ...variables, ga_event_sent: true, ga_event_name: eventName },
            };
        });

        this.register('send_form', async (config, variables) => {
            const fields = this.parseJsonInput(config.fields, []);
            return {
                output_variables: {
                    ...variables,
                    form_request: fields,
                    awaiting_form_submission: true,
                },
                pause_execution: true,
                wait_for: 'form_submission',
            };
        });

        this.register('assign_agent', async (config, variables, context) => {
            const assignTo = this.resolveConfigValue(config, ['agent_id', 'department_id'], variables);
            const assignmentMode = config.fallback || config.method || 'direct';

            try {
                if (context.conversation_id && assignTo) {
                    try {
                        await pool.query(
                            `UPDATE conversations SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                            [assignTo, context.conversation_id]
                        );
                    } catch {
                        await pool.query(
                            `UPDATE conversations SET assigned_agent_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                            [assignTo, context.conversation_id]
                        );
                    }
                }
            } catch (error: any) {
                return { output_variables: variables, error: error.message };
            }

            return {
                output_variables: {
                    ...variables,
                    assigned_to: assignTo,
                    routing_method: assignmentMode,
                },
            };
        });

        this.register('reassign_dept', async (config, variables, context) => {
            const departmentId = config.department_id || config.department || 'department_queue';
            return this.execute('assign_agent', { department_id: departmentId, method: 'department' }, variables, context);
        });

        this.register('disable_input', async (config, variables) => ({
            output_variables: { ...variables, input_disabled: true },
        }));

        this.register('enable_input', async (config, variables) => ({
            output_variables: { ...variables, input_disabled: false },
        }));

        this.register('subscribe_mailing', async (config, variables, context) =>
            this.execute('subscribe_newsletter', {
                email: variables.visitor_email || variables.email || config.email,
                list_name: config.list_name,
            }, variables, context)
        );

        this.register('send_notification', async (config, variables, context) => {
            const text = this.resolveConfigValue(config, ['notification_text', 'message'], variables);
            const channel = config.channel || 'browser';
            await integrationEvents.fireEvent('conversation.created', {
                workspaceId: context.workspace_id,
                contact: {
                    name: variables.visitor_name,
                    email: variables.visitor_email,
                },
                conversation: {
                    id: context.conversation_id,
                    channel,
                },
                message: {
                    text,
                    senderType: 'bot',
                },
            }).catch(() => { });

            return {
                output_variables: { ...variables, notification_sent: true, notification_channel: channel },
            };
        });

        this.register('to_another_flow', async (config, variables, context) =>
            this.execute('redirect_flow', { target_flow_id: config.target_flow_id, pass_variables: config.pass_variables }, variables, context)
        );

        this.register('flow_ended', async (config, variables) => ({
            output_variables: {
                ...variables,
                flow_ended: true,
                final_message: this.resolveConfigValue(config, ['message'], variables),
                show_survey: Boolean(config.show_survey),
            },
        }));

        this.register('open_website', async (config, variables) => ({
            output_variables: {
                ...variables,
                website_modal: {
                    url: this.resolveConfigValue(config, ['url'], variables),
                    width: Number(config.width || 400),
                    height: Number(config.height || 500),
                    title: this.resolveConfigValue(config, ['title'], variables),
                },
            },
        }));

        this.register('shopify_order', async (config, variables, context) => {
            const lookupValue = this.resolveConfigValue(config, ['value'], variables);
            const lookupBy = config.lookup_by || 'email';
            const result = await shopifyToolsService.executeTool(
                lookupBy === 'email' ? 'get_customer_orders' : 'get_order_status',
                lookupBy === 'email' ? { email: lookupValue } : { order_number: lookupValue },
                context.workspace_id
            );
            return {
                output_variables: { ...variables, shopify_order_result: result },
            };
        });

        this.register('shopify_product', async (config, variables, context) => {
            const productTitle = this.resolveConfigValue(config, ['product_id'], variables);
            const result = await shopifyToolsService.executeTool(
                'check_product_availability',
                { product_title: productTitle, variant: config.variant },
                context.workspace_id
            );
            return {
                output_variables: { ...variables, shopify_product_result: result },
            };
        });

        this.register('shopify_shipping', async (config, variables, context) => {
            const orderId = this.resolveConfigValue(config, ['order_id'], variables);
            const result = await shopifyToolsService.executeTool(
                'track_shipment',
                { order_number: orderId },
                context.workspace_id
            );
            return {
                output_variables: { ...variables, shopify_shipping_result: result },
            };
        });

        this.register('shopify_coupon', async (config, variables, context) => {
            const storeRes = await pool.query(
                `SELECT id, shop_domain, access_token
                 FROM shopify_configs
                 WHERE workspace_id = $1 AND is_active = true
                 LIMIT 1`,
                [context.workspace_id]
            );

            if (storeRes.rows.length === 0) {
                return { output_variables: { ...variables, coupon_created: false }, error: 'No Shopify store connected.' };
            }

            try {
                const { ShopifyApiClient } = await import('../shopify/ShopifyApiClient.js');
                const client = new ShopifyApiClient(storeRes.rows[0].shop_domain, storeRes.rows[0].access_token);
                const couponCode = this.generateCouponCode();
                const discountType = config.discount_type === 'fixed' ? 'fixed_amount' : 'percentage';
                const amount = Number(config.amount || 10);

                const priceRuleBody: any = {
                    price_rule: {
                        title: couponCode,
                        target_type: 'line_item',
                        target_selection: 'all',
                        allocation_method: 'across',
                        value_type: discountType,
                        value: `-${amount}`,
                        customer_selection: 'all',
                        starts_at: new Date().toISOString(),
                    },
                };

                if (config.expiry_days) {
                    const endsAt = new Date();
                    endsAt.setDate(endsAt.getDate() + Number(config.expiry_days));
                    priceRuleBody.price_rule.ends_at = endsAt.toISOString();
                }
                if (config.min_order) {
                    priceRuleBody.price_rule.prerequisite_subtotal_range = {
                        greater_than_or_equal_to: String(config.min_order),
                    };
                }
                if (config.one_time) {
                    priceRuleBody.price_rule.usage_limit = 1;
                }

                const priceRule = await (client as any).post('/price_rules.json', priceRuleBody);
                await (client as any).post(`/price_rules/${priceRule.price_rule.id}/discount_codes.json`, {
                    discount_code: { code: couponCode },
                });

                return {
                    output_variables: {
                        ...variables,
                        coupon_created: true,
                        coupon_code: couponCode,
                        coupon_amount: amount,
                    },
                };
            } catch (error: any) {
                return { output_variables: { ...variables, coupon_created: false }, error: error.message };
            }
        });

        this.register('doc_loader', async (config, variables) => {
            const sourceType = config.source_type || 'text';
            if (sourceType === 'url' && config.url) {
                const response = await fetch(this.resolveConfigValue(config, ['url'], variables));
                const html = await response.text();
                const documentText = this.stripHtml(html);
                return {
                    output_variables: { ...variables, document_text: documentText, document_source: config.url },
                };
            }
            if (sourceType === 'api' && config.api_url) {
                const response = await fetch(this.resolveConfigValue(config, ['api_url'], variables));
                const payload = await response.text();
                return {
                    output_variables: { ...variables, document_text: payload, document_source: config.api_url },
                };
            }
            const rawText = this.resolveConfigValue(config, ['text', 'content', 'raw_text'], variables);
            return {
                output_variables: { ...variables, document_text: rawText, document_source: sourceType },
            };
        });

        this.register('text_splitter', async (config, variables) => {
            const sourceText = String(
                variables.document_text ||
                variables.response_text ||
                variables.context_string ||
                ''
            );
            const chunks = this.chunkText(
                sourceText,
                Number(config.chunk_size || 512),
                Number(config.chunk_overlap || 50),
                config.strategy || 'fixed_size'
            );
            return {
                output_variables: { ...variables, document_chunks: chunks, chunk_count: chunks.length },
            };
        });

        this.register('embedding_model', async (config, variables) => ({
            output_variables: {
                ...variables,
                embedding_model_selected: config.model || 'text-embedding-3-small',
                embedding_dimensions: Number(config.dimensions || 1536),
            },
        }));

        this.register('vector_store_writer', async (config, variables) => ({
            output_variables: {
                ...variables,
                vector_store_write_count: Array.isArray(variables.document_chunks) ? variables.document_chunks.length : 0,
                vector_store_target: config.kb_id || null,
            },
        }));

        this.register('web_crawler', async (config, variables) => {
            const startUrl = this.resolveConfigValue(config, ['start_url'], variables);
            const response = await fetch(startUrl);
            const html = await response.text();
            const content = this.stripHtml(html);
            return {
                output_variables: {
                    ...variables,
                    crawled_pages: [{ url: startUrl, content }],
                    crawl_count: 1,
                },
            };
        });

        this.register('reranker', async (config, variables) => {
            const topN = Math.max(1, Number(config.top_n || 3));
            const chunks = Array.isArray(variables.retrieved_chunks) ? [...variables.retrieved_chunks] : [];
            const reranked = chunks
                .sort((a: any, b: any) => Number(b.score || 0) - Number(a.score || 0))
                .slice(0, topN);
            return {
                output_variables: {
                    ...variables,
                    retrieved_chunks: reranked,
                    reranked_chunks: reranked,
                },
            };
        });

        this.register('prompt_template', async (config, variables) => {
            const systemPrompt = this.interpolate(config.system_prompt || config.system_message || '', variables);
            const historyMessages = Array.isArray(variables.messages_array) ? variables.messages_array : [];
            const latestUserMessage = variables.pending_question || variables.message_text || variables.prompt || '';
            return {
                output_variables: {
                    ...variables,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...historyMessages,
                        ...(latestUserMessage ? [{ role: 'user', content: String(latestUserMessage) }] : []),
                    ],
                },
            };
        });

        this.register('llm_call', async (config, variables) => {
            const messages = Array.isArray(variables.messages) ? variables.messages : [];
            if (messages.length === 0) {
                return { output_variables: variables, error: 'No messages found. Connect a Prompt Template node first.' };
            }

            try {
                const useSarvam = Boolean(process.env.SARVAM_API_KEY) && !String(config.model || '').startsWith('gpt-');
                const apiKey = useSarvam ? process.env.SARVAM_API_KEY : process.env.OPENAI_API_KEY;
                if (!apiKey) {
                    return {
                        output_variables: {
                            ...variables,
                            response_text: '',
                            rag_response: '',
                        },
                        error: 'No LLM API key configured',
                    };
                }

                const model = config.model || (useSarvam ? 'sarvam-m' : 'gpt-4o-mini');
                const baseUrl = useSarvam
                    ? 'https://api.sarvam.ai/v1/chat/completions'
                    : 'https://api.openai.com/v1/chat/completions';
                const response = await fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature: config.temperature ?? 0.3,
                        max_tokens: config.max_tokens ?? 500,
                    }),
                });

                const data = await response.json() as any;
                const responseText = data.choices?.[0]?.message?.content || '';
                const tokensUsed = data.usage?.total_tokens || 0;

                return {
                    output_variables: {
                        ...variables,
                        response_text: responseText,
                        rag_response: responseText,
                        llm_model: model,
                    },
                    tokens_used: tokensUsed,
                    cost_usd: tokensUsed * 0.000005,
                };
            } catch (error: any) {
                return {
                    output_variables: { ...variables },
                    error: `LLM Call failed: ${error.message}`,
                };
            }
        });

        this.register('chat_history_injector', async (config, variables, context) => {
            const maxTurns = Math.max(1, Number(config.max_turns || 8));
            const history = await this.loadConversationMessages(context.conversation_id, maxTurns);
            const format = config.format || 'messages';
            return {
                output_variables: {
                    ...variables,
                    messages_array: format === 'messages'
                        ? history
                        : history.map((message: any) => `${message.role}: ${message.content}`).join('\n'),
                    chat_history: history,
                },
            };
        });

        this.register('output_parser', async (config, variables) => {
            const rawResponse = variables.response_text || '';
            if ((config.format || 'text') === 'regex' && config.regex_pattern) {
                try {
                    const match = String(rawResponse).match(new RegExp(config.regex_pattern, 'i'));
                    return {
                        output_variables: { ...variables, parsed_output: match?.[1] || match?.[0] || '' },
                    };
                } catch (error: any) {
                    return { output_variables: variables, error: error.message };
                }
            }

            let parsed: any = rawResponse;
            if (config.format === 'json') {
                parsed = this.parseJsonInput(rawResponse, rawResponse);
            }

            return {
                output_variables: {
                    ...variables,
                    parsed_output: typeof parsed === 'string'
                        ? parsed.replace(/```[\s\S]*?```/g, '').replace(/[*_~`]/g, '').trim()
                        : parsed,
                },
            };
        });

        this.register('streaming_response', async (config, variables) => {
            const text = String(variables.response_text || variables.parsed_output || '');
            const chunkSize = Math.max(1, Number(config.chunk_size || 40));
            const chunks = text.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [];
            return {
                output_variables: {
                    ...variables,
                    streaming_enabled: config.enabled !== false,
                    streaming_chunks: chunks,
                },
            };
        });

        this.register('session_memory_read', async (config, variables, context) => {
            const redisKey = `flow:session:${context.execution_id}`;
            const snapshot = this.parseJsonInput(await redis.get(redisKey).catch(() => null), {});
            const keys = this.toStringArray(config.keys);
            const selected = keys.length === 0
                ? snapshot
                : Object.fromEntries(keys.map((key) => [key, snapshot[key]]));
            return {
                output_variables: { ...variables, session_memory: selected },
            };
        });

        this.register('session_memory_write', async (config, variables, context) => {
            const redisKey = `flow:session:${context.execution_id}`;
            const current = this.parseJsonInput(await redis.get(redisKey).catch(() => null), {});
            const key = config.key || 'memory_key';
            const value = this.resolveConfigValue(config, ['value'], variables);
            const next = { ...current, [key]: value };
            await redis.setex(redisKey, Number(config.ttl_seconds || 86400), JSON.stringify(next)).catch(() => { });
            return {
                output_variables: { ...variables, session_memory: next, memory_stored: true },
            };
        });

        this.register('conversation_summarizer', async (config, variables, context) => {
            const history = await this.loadConversationMessages(context.conversation_id, Math.max(3, Number(config.trigger_after_turns || 15)));
            const summary = history
                .slice(-Math.max(3, Number(config.trigger_after_turns || 15)))
                .map((message: any) => `${message.role}: ${message.content}`)
                .join('\n')
                .slice(0, 1200);
            return {
                output_variables: { ...variables, conversation_summary: summary },
            };
        });

        this.register('entity_extractor', async (config, variables) => {
            const text = String(this.resolveConfigValue(config, ['input_variable'], variables) || variables.message_text || '');
            return {
                output_variables: {
                    ...variables,
                    extracted_entities: this.extractEntities(text, this.toStringArray(config.entity_types)),
                },
            };
        });

        this.register('ai_agent', async (config, variables, context) => {
            const promptSource = config.source_prompt === 'custom'
                ? this.resolveConfigValue(config, ['prompt'], variables)
                : variables.message_text || variables.pending_question || '';
            const systemMessage = config.system_message || 'You are a helpful AI agent.';
            return this.execute('llm_call', {
                model: config.model || 'gpt-4o-mini',
                temperature: config.temperature ?? 0.3,
                max_tokens: config.max_tokens ?? 500,
            }, {
                ...variables,
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: String(promptSource || '') },
                ],
            }, context);
        });

        this.register('tool_node', async (config, variables, context) => {
            const toolType = config.tool_type || 'custom';
            const toolConfig = this.parseJsonInput(config.tool_config, {});
            if (toolType === 'calculator') {
                const expression = toolConfig.expression || variables.message_text || '0';
                try {
                    const value = this.evaluateExpression(String(expression), null, variables);
                    return { output_variables: { ...variables, tool_result: value } };
                } catch (error: any) {
                    return { output_variables: variables, error: error.message };
                }
            }

            if (toolType === 'kb_lookup') {
                return {
                    output_variables: {
                        ...variables,
                        tool_result: variables.retrieved_chunks || [],
                    },
                };
            }

            if (toolType === 'web_search') {
                const query = toolConfig.query || variables.message_text || '';
                try {
                    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
                    const payload = await response.json() as any;
                    return {
                        output_variables: {
                            ...variables,
                            tool_result: payload.AbstractText || payload.Heading || query,
                        },
                    };
                } catch (error: any) {
                    return {
                        output_variables: { ...variables, tool_result: query },
                        error: error.message,
                    };
                }
            }

            return this.execute('api_call', {
                method: toolConfig.method || 'GET',
                url: toolConfig.url || config.url,
                headers: toolConfig.headers,
                body: toolConfig.body,
                response_variable: toolConfig.response_variable || 'tool_result',
            }, variables, context);
        });

        this.register('code_interpreter', async (config, variables) => {
            try {
                const language = config.language || 'javascript';
                const result = this.executeCodeSnippet(language, String(config.code || ''), variables);
                return {
                    output_variables: { ...variables, code_output: result },
                };
            } catch (error: any) {
                return { output_variables: variables, error: error.message };
            }
        });

        this.register('multi_agent_router', async (config, variables) => {
            const routingStrategy = config.routing_strategy || 'rules';
            const agentConfigs = this.parseJsonInput(config.agents, []);
            const message = String(variables.message_text || variables.pending_question || '').toLowerCase();

            let selectedAgent = agentConfigs[0] || null;
            if (routingStrategy === 'rules') {
                selectedAgent = agentConfigs.find((agent: any) =>
                    this.toStringArray(agent.keywords).some((keyword) => message.includes(String(keyword).toLowerCase()))
                ) || agentConfigs[0] || null;
            } else if (routingStrategy === 'llm') {
                selectedAgent = agentConfigs
                    .map((agent: any) => ({
                        ...agent,
                        score: this.toStringArray(agent.keywords).reduce((score, keyword) =>
                            score + (message.includes(String(keyword).toLowerCase()) ? 1 : 0), 0),
                    }))
                    .sort((a: any, b: any) => b.score - a.score)[0] || null;
            }

            return {
                output_variables: {
                    ...variables,
                    routed_agent: selectedAgent,
                    routed_agent_name: selectedAgent?.name || null,
                },
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

    private resolveConfigValue(
        config: Record<string, any>,
        keys: string[],
        variables: Record<string, any>
    ) {
        for (const key of keys) {
            const rawValue = config?.[key];
            if (rawValue === undefined || rawValue === null) continue;

            if (typeof rawValue === 'string') {
                const interpolated = this.interpolate(rawValue, variables);
                if (interpolated.startsWith('{{') && interpolated.endsWith('}}')) {
                    const variableName = interpolated.slice(2, -2).trim();
                    return variables[variableName];
                }
                return interpolated;
            }

            return rawValue;
        }

        return '';
    }

    private toStringArray(value: any): string[] {
        if (Array.isArray(value)) {
            return value.map((entry) => String(entry).trim()).filter(Boolean);
        }
        if (typeof value === 'string') {
            return value
                .split(/\r?\n|,/)
                .map((entry) => entry.trim())
                .filter(Boolean);
        }
        return [];
    }

    private matchPattern(input: string, pattern: any, matchType: string) {
        const value = String(input || '');
        const expected = String(pattern || '');
        if (!expected) return Boolean(value);

        if (matchType === 'exact') return value === expected;
        if (matchType === 'regex') {
            try {
                return new RegExp(expected, 'i').test(value);
            } catch {
                return false;
            }
        }
        if (matchType === 'starts_with') return value.startsWith(expected);
        return value.includes(expected);
    }

    private parseJsonInput(value: any, fallback: any) {
        if (value === undefined || value === null || value === '') return fallback;
        if (typeof value === 'object') return value;
        if (typeof value !== 'string') return fallback;
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    private evaluateExpression(expression: string, value: any, variables: Record<string, any>) {
        const sandbox = {
            value,
            variables,
            Math,
            Number,
            String,
            Boolean,
            Array,
            JSON,
            Date,
        };
        const script = new vm.Script(`(${expression})`);
        return script.runInNewContext(sandbox, { timeout: 1000 });
    }

    private async loadConversationMessages(conversationId?: string, maxTurns: number = 8) {
        if (!conversationId) return [];
        try {
            const result = await pool.query(
                `SELECT sender_type, content
                 FROM messages
                 WHERE conversation_id = $1
                 ORDER BY created_at DESC
                 LIMIT $2`,
                [conversationId, maxTurns]
            );
            return result.rows
                .reverse()
                .map((row: any) => ({
                    role: row.sender_type === 'agent' ? 'assistant' : 'user',
                    content: row.content,
                }));
        } catch {
            return [];
        }
    }

    private extractEntities(text: string, entityTypes: string[]) {
        const entities: Record<string, any[]> = {};
        const normalizedTypes = entityTypes.length > 0 ? entityTypes : ['email', 'phone', 'order_number', 'date'];

        if (normalizedTypes.includes('email')) {
            entities.email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
        }
        if (normalizedTypes.includes('phone')) {
            entities.phone = text.match(/\+?\d[\d\s-]{7,}\d/g) || [];
        }
        if (normalizedTypes.includes('order_number')) {
            entities.order_number = text.match(/#?\d{4,}/g) || [];
        }
        if (normalizedTypes.includes('date')) {
            entities.date = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) || [];
        }
        if (normalizedTypes.includes('person')) {
            entities.person = (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || []).slice(0, 5);
        }
        if (normalizedTypes.includes('product')) {
            entities.product = (text.match(/\b[a-zA-Z0-9][\w\s-]{2,40}\b/g) || []).slice(0, 5);
        }

        return entities;
    }

    private normalizeChannelValue(value: string) {
        const normalized = String(value || '').toLowerCase();
        if (normalized === 'live_chat' || normalized === 'web' || normalized === 'chat') return 'live_chat';
        return normalized;
    }

    private stripHtml(html: string) {
        return String(html || '')
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private chunkText(text: string, chunkSize: number, chunkOverlap: number, strategy: string) {
        if (!text) return [];

        if (strategy === 'paragraph') {
            return text.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean);
        }

        if (strategy === 'sentence') {
            return text.match(/[^.!?]+[.!?]+/g)?.map((chunk) => chunk.trim()).filter(Boolean) || [text];
        }

        const chunks: string[] = [];
        const safeChunkSize = Math.max(50, chunkSize || 512);
        const safeOverlap = Math.max(0, Math.min(chunkOverlap || 0, safeChunkSize - 1));

        for (let start = 0; start < text.length; start += safeChunkSize - safeOverlap || safeChunkSize) {
            const end = Math.min(start + safeChunkSize, text.length);
            const chunk = text.slice(start, end).trim();
            if (chunk) chunks.push(chunk);
            if (end >= text.length) break;
        }

        return chunks;
    }

    private pickWeightedBranch(branchCount: number, weights: number[]) {
        const normalizedWeights = weights.length === branchCount
            ? weights
            : Array.from({ length: branchCount }, () => 100 / branchCount);
        const total = normalizedWeights.reduce((sum, weight) => sum + weight, 0) || branchCount;
        const randomValue = Math.random() * total;
        let cursor = 0;

        for (let index = 0; index < normalizedWeights.length; index++) {
            cursor += normalizedWeights[index];
            if (randomValue <= cursor) return index + 1;
        }

        return branchCount;
    }

    private generateCouponCode() {
        return `FF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }

    private executeCodeSnippet(language: string, source: string, variables: Record<string, any>) {
        const normalizedLanguage = String(language || 'javascript').toLowerCase();
        const inputData = { ...variables };

        if (normalizedLanguage === 'python') {
            const translated = source
                .replace(/\bTrue\b/g, 'true')
                .replace(/\bFalse\b/g, 'false')
                .replace(/\bNone\b/g, 'null')
                .replace(/input_data/g, 'inputData');
            const scriptBody = translated.includes('result =')
                ? `${translated}\nresult;`
                : translated;
            const script = new vm.Script(scriptBody);
            return script.runInNewContext({ inputData, variables, result: null, Math, JSON }, { timeout: 1000 });
        }

        const script = new vm.Script(source.includes('return') ? source : `${source}\nresult;`);
        return script.runInNewContext({ inputData, variables, result: null, Math, JSON }, { timeout: 1000 });
    }
}
