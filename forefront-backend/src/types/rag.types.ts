/**
 * RAG & Conversa AI type definitions.
 *
 * All interfaces for the RAG pipeline, Conversa AI orchestration,
 * guardrails, handoff, copilot, and tool registry.
 */

// ─── RAG Core ────────────────────────────────────────────────────────

export interface RagChunk {
    id: string;
    document_id: string;
    workspace_id: string;
    content: string;
    token_count: number;
    chunk_index: number;
    embedding?: number[];
    metadata: {
        source: string;
        source_id?: string;
        title?: string;
        url?: string;
        language?: string;
        updated_at?: string;
    };
}

export interface RagSource {
    document_id: string;
    title?: string;
    url?: string;
    excerpt: string;
    score: number;
}

export interface RagContext {
    chunks: RagChunk[];
    total_found: number;
    query_tokens: number;
    retrieval_ms: number;
}

// ─── Guardrails ──────────────────────────────────────────────────────

export type GuardrailType =
    | 'topic_block'
    | 'keyword_filter'
    | 'pii_detection'
    | 'confidence_gate'
    | 'custom_regex';

export type GuardrailAction = 'allow' | 'block' | 'rephrase' | 'handoff';

export interface GuardrailRule {
    id: string;
    workspace_id: string;
    name: string;
    type: GuardrailType;
    config: Record<string, any>;
    action: GuardrailAction;
    priority: number;
    enabled: boolean;
}

export interface GuardrailEvaluation {
    passed: boolean;
    action: GuardrailAction;
    triggered_rules: string[];
    rephrased?: string;
}

// ─── Handoff ─────────────────────────────────────────────────────────

export type HandoffTrigger =
    | 'low_confidence'
    | 'customer_request'
    | 'repeated_failure'
    | 'sentiment_negative'
    | 'guardrail_block'
    | 'topic_unsupported'
    | 'agent_escalation_rule';

export interface HandoffEvent {
    id: string;
    conversation_id: string;
    workspace_id: string;
    trigger: HandoffTrigger;
    trigger_detail?: string;
    ai_summary?: string;
    suggested_response?: string;
    priority: string;
    assigned_agent_id?: string;
    assigned_team_id?: string;
    status: 'pending' | 'accepted' | 'resolved' | 'expired';
    created_at: Date;
    accepted_at?: Date;
    resolved_at?: Date;
}

// ─── Conversa Session ────────────────────────────────────────────────────

export interface ConversaSessionMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    timestamp: string;
    tool_call_id?: string;
    tool_name?: string;
}

export interface ConversaSession {
    id: string;
    conversation_id?: string;
    workspace_id: string;
    contact_id?: string;
    messages: ConversaSessionMessage[];
    handed_off: boolean;
    failed_attempts: number;
    total_tokens_used: number;
    language: string;
}

// ─── Conversa Response ───────────────────────────────────────────────────

export interface ConversaResponse {
    answer: string;
    confidence: number; // 0-1
    sources: RagSource[];
    handoff_recommended: boolean;
    handoff_reason?: string;
    function_calls_executed: FunctionCallResult[];
    guardrail_evaluation: GuardrailEvaluation;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        embedding_tokens: number;
    };
    session_id: string;
    message_id: string;
}

// ─── Tool / Function Calling ─────────────────────────────────────────

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required: boolean;
    enum?: string[];
}

export interface RegisteredTool {
    name: string;
    description: string;
    parameters: ToolParameter[];
    handler: (args: Record<string, unknown>, context: ToolExecutionContext) => Promise<any>;
    scope: 'global' | 'workspace';
    workspace_id?: string;
}

export interface ToolExecutionContext {
    workspace_id: string;
    conversation_id?: string;
    visitor_id?: string;
    agent_id?: string;
}

export interface FunctionCallResult {
    tool_name: string;
    args: Record<string, unknown>;
    result: any;
    success: boolean;
    error?: string;
    duration_ms: number;
}

// ─── Copilot ─────────────────────────────────────────────────────────

export type CopilotSuggestionType =
    | 'reply_draft'
    | 'kb_article'
    | 'quick_action'
    | 'tone_rephrase';

export interface CopilotRequest {
    workspace_id: string;
    conversation_id: string;
    request_type: 'reply_draft' | 'kb_search' | 'tone_rephrase' | 'all';
    messages: ConversaSessionMessage[];
    draft_text?: string; // for tone_rephrase
}

export interface CopilotSuggestion {
    type: CopilotSuggestionType;
    content: string;
    label?: string;
    sources?: RagSource[];
    confidence?: number;
}

export interface CopilotResponse {
    suggestions: CopilotSuggestion[];
    processing_ms: number;
}
