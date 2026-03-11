/**
 * GuardrailsService — Configurable AI safety rules.
 *
 * Evaluates input/output against workspace-specific rules: topic blocking,
 * keyword filtering, PII detection, confidence gating, and custom regex.
 * Rules are cached in-memory for 60 seconds per workspace.
 */
import type { GuardrailRule, GuardrailEvaluation } from '../../types/rag.types.js';
export declare class GuardrailsService {
    /**
     * Load enabled guardrail rules for a workspace, with 60s cache.
     */
    loadRules(workspaceId: string): Promise<GuardrailRule[]>;
    /**
     * Evaluate user INPUT against guardrail rules.
     */
    evaluate(input: string, workspaceId: string): Promise<GuardrailEvaluation>;
    /**
     * Evaluate AI OUTPUT + confidence against guardrail rules.
     */
    evaluateOutput(output: string, confidence: number, workspaceId: string): Promise<GuardrailEvaluation>;
    /**
     * Check a single rule against text. Returns true if rule is triggered.
     */
    private checkRule;
    /**
     * Redact detected PII from text.
     */
    private redactPII;
    /**
     * Invalidate the cache for a workspace (call after rule CRUD).
     */
    invalidateCache(workspaceId: string): void;
    createRule(rule: Omit<GuardrailRule, 'id'>): Promise<GuardrailRule>;
    updateRule(id: string, updates: Partial<GuardrailRule>): Promise<GuardrailRule>;
    deleteRule(id: string): Promise<void>;
}
export declare const guardrailsService: GuardrailsService;
//# sourceMappingURL=GuardrailsService.d.ts.map