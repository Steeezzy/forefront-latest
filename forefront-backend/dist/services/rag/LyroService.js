/**
 * LyroService — Main AI orchestration engine.
 *
 * Full pipeline: input guardrails → embed → search → rerank → context build →
 * Sarvam/OpenAI chat with function calling → output guardrails → handoff check.
 *
 * Uses Sarvam AI as primary LLM (per project rules), OpenAI for embeddings only.
 */
import * as crypto from 'crypto';
import { pool } from '../../config/db.js';
import { sarvamClient } from '../SarvamClient.js';
import { EmbeddingService } from './EmbeddingService.js';
import { VectorSearchService } from './VectorSearchService.js';
import { RerankerService } from './RerankerService.js';
import { GuardrailsService } from './GuardrailsService.js';
import { customerContextService } from '../shopify/CustomerContextService.js';
import { ToolRegistryService } from './ToolRegistryService.js';
import { HandoffService } from './HandoffService.js';
// ─── System Prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Lyro, a helpful AI customer support assistant. Answer questions based ONLY on the provided knowledge base context. If the context doesn't contain enough information, say so honestly rather than guessing. Be concise, friendly, and accurate. Do not make up facts.

Rules:
1. Only use information from the Knowledge Base Context below
2. If unsure, say "I don't have enough information to answer that. Would you like me to connect you with a human agent?"
3. Keep responses under 200 words unless the question requires detail
4. Be professional but warm
5. If the customer asks for something you can't do, suggest alternatives
6. Support multiple Indian languages — respond in the same language the customer uses

Knowledge Base Context:
{context}`;
export class LyroService {
    embeddingService;
    searchService;
    rerankerService;
    guardrailsService;
    toolRegistryService;
    handoffService;
    constructor() {
        this.embeddingService = new EmbeddingService();
        this.searchService = new VectorSearchService();
        this.rerankerService = new RerankerService();
        this.guardrailsService = new GuardrailsService();
        this.toolRegistryService = new ToolRegistryService();
        this.handoffService = new HandoffService();
    }
    /**
     * Main chat method — full RAG + AI pipeline.
     */
    async chat(params) {
        const messageId = crypto.randomUUID();
        const startTime = Date.now();
        // 1. Load or create session
        let session = await this.getSession(params.session_id);
        if (!session) {
            session = await this.createSession(params);
        }
        // 2. Input guardrails
        const inputGuardrails = await this.guardrailsService.evaluate(params.message, params.workspace_id);
        if (inputGuardrails.action === 'block') {
            return this.buildBlockedResponse(inputGuardrails, session.id, messageId);
        }
        const effectiveMessage = inputGuardrails.rephrased || params.message;
        // 3. Embed the query
        const { embedding, tokens_used: embeddingTokens } = await this.embeddingService.embedText(effectiveMessage);
        // 4. Vector search (top 10)
        const searchResults = await this.searchService.search(params.workspace_id, embedding, { top_k: 10, min_score: 0.68 });
        // 5. Rerank (top 5)
        const rerankedResults = await this.rerankerService.rerank(effectiveMessage, searchResults, 5);
        // 6. Build context
        const contextString = this.rerankerService.buildContext(rerankedResults, 3000);
        // Fetch E-commerce Context if applicable (matches contact email)
        let ecommerceStr = '';
        if (session.contact_id) {
            const ctx = await customerContextService.getContextByConversation(params.conversation_id);
            if (ctx)
                ecommerceStr = `\n\n=== E-Commerce Context ===\n${customerContextService.formatContextForAI(ctx)}`;
        }
        // 7. Build messages array
        let systemPrompt = SYSTEM_PROMPT.replace('{context}', contextString || 'No relevant knowledge base articles found.');
        if (ecommerceStr)
            systemPrompt += ecommerceStr;
        const chatMessages = [
            { role: 'system', content: systemPrompt },
        ];
        // Add last 8 session messages for continuity
        const recentHistory = session.messages.slice(-8);
        for (const msg of recentHistory) {
            if (msg.role === 'user' || msg.role === 'assistant') {
                chatMessages.push({ role: msg.role, content: msg.content });
            }
        }
        // Add current message
        chatMessages.push({ role: 'user', content: effectiveMessage });
        // 8. Call Sarvam AI (primary LLM)
        let responseText = '';
        let promptTokens = 0;
        let completionTokens = 0;
        const functionCallResults = [];
        try {
            const llmResponse = await sarvamClient.chatCompletion(chatMessages, {
                temperature: 0.2,
                max_tokens: 500,
            });
            responseText = llmResponse.choices?.[0]?.message?.content || '';
            promptTokens = llmResponse.usage?.prompt_tokens || 0;
            completionTokens = llmResponse.usage?.completion_tokens || 0;
            // 9. Handle tool calls if any (Sarvam supports function calling)
            const toolCalls = llmResponse.choices?.[0]?.message?.tool_calls;
            if (toolCalls && toolCalls.length > 0) {
                for (const toolCall of toolCalls) {
                    const args = JSON.parse(toolCall.function.arguments || '{}');
                    const result = await this.toolRegistryService.execute(toolCall.function.name, args, {
                        workspace_id: params.workspace_id,
                        conversation_id: params.conversation_id,
                        visitor_id: session.contact_id,
                    });
                    functionCallResults.push(result);
                    // Add tool result to messages and make a second call
                    chatMessages.push({
                        role: 'assistant',
                        content: JSON.stringify({
                            tool_calls: [{ id: toolCall.id, function: toolCall.function }],
                        }),
                    });
                    // Note: Sarvam may not support tool result messages in the same format.
                    // We'll inject the result into the context and re-call.
                }
                // Second call with tool results in context
                if (functionCallResults.length > 0) {
                    const toolResultsSummary = functionCallResults
                        .map((r) => `[Tool: ${r.tool_name}] ${r.success ? JSON.stringify(r.result) : `Error: ${r.error}`}`)
                        .join('\n');
                    chatMessages.push({
                        role: 'user',
                        content: `Tool results:\n${toolResultsSummary}\n\nBased on these results, please provide your answer.`,
                    });
                    const secondResponse = await sarvamClient.chatCompletion(chatMessages, {
                        temperature: 0.2,
                        max_tokens: 500,
                    });
                    responseText = secondResponse.choices?.[0]?.message?.content || responseText;
                    promptTokens += secondResponse.usage?.prompt_tokens || 0;
                    completionTokens += secondResponse.usage?.completion_tokens || 0;
                }
            }
        }
        catch (error) {
            console.error('[LyroService] LLM call failed:', error.message);
            responseText = "I'm sorry, I'm having trouble processing your request right now. Would you like me to connect you with a human agent?";
        }
        // 10. Calculate confidence
        const confidence = this.calculateConfidence(rerankedResults, responseText);
        // 11. Output guardrails
        const outputGuardrails = await this.guardrailsService.evaluateOutput(responseText, confidence, params.workspace_id);
        if (outputGuardrails.action === 'block') {
            responseText = "I'm not able to provide that information. Let me connect you with a human agent who can help.";
        }
        else if (outputGuardrails.rephrased) {
            responseText = outputGuardrails.rephrased;
        }
        // 12. Update failed attempts counter
        if (confidence < 0.45) {
            session.failed_attempts += 1;
        }
        else {
            session.failed_attempts = 0; // reset on good response
        }
        // 13. Check handoff
        const lyroResponse = {
            answer: responseText,
            confidence,
            sources: this.buildSources(rerankedResults),
            handoff_recommended: false,
            function_calls_executed: functionCallResults,
            guardrail_evaluation: outputGuardrails,
            usage: {
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: promptTokens + completionTokens,
                embedding_tokens: embeddingTokens,
            },
            session_id: session.id,
            message_id: messageId,
        };
        const handoffCheck = this.handoffService.shouldHandoff(session, lyroResponse);
        if (handoffCheck.handoff) {
            lyroResponse.handoff_recommended = true;
            lyroResponse.handoff_reason = handoffCheck.reason;
            // Create handoff event
            await this.handoffService.createHandoffEvent({
                conversation_id: params.conversation_id,
                workspace_id: params.workspace_id,
                trigger: handoffCheck.trigger,
                trigger_detail: handoffCheck.reason,
                session,
            });
            session.handed_off = true;
        }
        // 14. Update session with new messages
        session.messages.push({ role: 'user', content: effectiveMessage, timestamp: new Date().toISOString() }, { role: 'assistant', content: responseText, timestamp: new Date().toISOString() });
        session.total_tokens_used += promptTokens + completionTokens + embeddingTokens;
        await this.updateSession(session);
        return lyroResponse;
    }
    // ─── Session Management ────────────────────────────────────────────
    async getSession(sessionId) {
        const result = await pool.query(`SELECT * FROM lyro_sessions WHERE id = $1`, [sessionId]);
        if (result.rows.length === 0)
            return null;
        const row = result.rows[0];
        return { ...row, messages: row.messages || [] };
    }
    async clearSession(sessionId) {
        await pool.query(`DELETE FROM lyro_sessions WHERE id = $1`, [sessionId]);
    }
    async createSession(params) {
        const result = await pool.query(`INSERT INTO lyro_sessions (id, conversation_id, workspace_id, contact_id, messages)
       VALUES ($1, $2, $3, $4, '[]'::jsonb) RETURNING *`, [params.session_id, params.conversation_id, params.workspace_id, params.contact_id || null]);
        return { ...result.rows[0], messages: [] };
    }
    async updateSession(session) {
        await pool.query(`UPDATE lyro_sessions
       SET messages = $1, handed_off = $2, failed_attempts = $3, total_tokens_used = $4
       WHERE id = $5`, [
            JSON.stringify(session.messages),
            session.handed_off,
            session.failed_attempts,
            session.total_tokens_used,
            session.id,
        ]);
    }
    // ─── Helpers ───────────────────────────────────────────────────────
    calculateConfidence(results, responseText) {
        if (results.length === 0)
            return 0.1;
        // Weighted average of top 3 chunk scores (70% weight)
        const topScores = results.slice(0, 3).map((r) => r.score);
        const avgChunkScore = topScores.reduce((sum, s) => sum + s, 0) / topScores.length;
        // Heuristic certainty from response text (30% weight)
        const lowerResponse = responseText.toLowerCase();
        const uncertainPhrases = [
            "i don't know", "i'm not sure", "i don't have", "i cannot",
            "no information", "unable to", "don't have enough",
        ];
        const isUncertain = uncertainPhrases.some((p) => lowerResponse.includes(p));
        const textCertainty = isUncertain ? 0.2 : 0.85;
        return 0.7 * avgChunkScore + 0.3 * textCertainty;
    }
    buildSources(results) {
        return results.map((r) => ({
            document_id: r.document_id,
            title: r.document_name,
            excerpt: r.chunk_text.slice(0, 300),
            score: r.score,
        }));
    }
    buildBlockedResponse(evaluation, sessionId, messageId) {
        return {
            answer: "I'm sorry, I can't process that request. Please rephrase your question or contact our support team directly.",
            confidence: 0,
            sources: [],
            handoff_recommended: evaluation.action === 'handoff',
            handoff_reason: evaluation.action === 'handoff' ? 'Input blocked by guardrails' : undefined,
            function_calls_executed: [],
            guardrail_evaluation: evaluation,
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, embedding_tokens: 0 },
            session_id: sessionId,
            message_id: messageId,
        };
    }
}
export const lyroService = new LyroService();
//# sourceMappingURL=LyroService.js.map