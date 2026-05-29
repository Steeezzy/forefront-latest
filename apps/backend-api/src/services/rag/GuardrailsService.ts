/**
 * GuardrailsService — Configurable AI safety rules.
 *
 * Evaluates input/output against workspace-specific rules: topic blocking,
 * keyword filtering, PII detection, confidence gating, and custom regex.
 * Rules are cached in-memory for 60 seconds per workspace.
 */

import { pool } from '../../config/db.js';
import type { GuardrailRule, GuardrailEvaluation, GuardrailAction } from '../../types/rag.types.js';

// In-memory rule cache: workspaceId → { rules, expiresAt }
const ruleCache = new Map<string, { rules: GuardrailRule[]; expiresAt: number }>();

// ─── PII Patterns ────────────────────────────────────────────────────
const PII_PATTERNS = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    credit_card: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    aadhaar: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Indian Aadhaar
    pan: /[A-Z]{5}\d{4}[A-Z]/g, // Indian PAN
};

export class GuardrailsService {

    /**
     * Load enabled guardrail rules for a workspace, with 60s cache.
     */
    async loadRules(workspaceId: string): Promise<GuardrailRule[]> {
        const cached = ruleCache.get(workspaceId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.rules;
        }

        const result = await pool.query(
            `SELECT * FROM guardrail_rules
       WHERE workspace_id = $1 AND enabled = true
       ORDER BY priority ASC`,
            [workspaceId]
        );

        const rules: GuardrailRule[] = result.rows;
        ruleCache.set(workspaceId, { rules, expiresAt: Date.now() + 60_000 });
        return rules;
    }

    /**
     * Evaluate user INPUT against guardrail rules.
     */
    async evaluate(input: string, workspaceId: string): Promise<GuardrailEvaluation> {
        const rules = await this.loadRules(workspaceId);
        const triggeredRules: string[] = [];
        let finalAction: GuardrailAction = 'allow';
        let rephrased: string | undefined;

        for (const rule of rules) {
            if (rule.type === 'confidence_gate') continue; // only evaluated on output

            const triggered = this.checkRule(rule, input);
            if (triggered) {
                triggeredRules.push(rule.name);

                if (rule.action === 'block' || rule.action === 'handoff') {
                    finalAction = rule.action;
                    break; // highest-priority blocking rule wins
                }
                if (rule.action === 'rephrase') {
                    finalAction = 'rephrase';
                    rephrased = this.redactPII(input, rule);
                }
            }
        }

        return {
            passed: finalAction === 'allow' || finalAction === 'rephrase',
            action: finalAction,
            triggered_rules: triggeredRules,
            rephrased,
        };
    }

    /**
     * Evaluate AI OUTPUT + confidence against guardrail rules.
     */
    async evaluateOutput(
        output: string,
        confidence: number,
        workspaceId: string
    ): Promise<GuardrailEvaluation> {
        const rules = await this.loadRules(workspaceId);
        const triggeredRules: string[] = [];
        let finalAction: GuardrailAction = 'allow';
        let rephrased: string | undefined;

        for (const rule of rules) {
            let triggered = false;

            if (rule.type === 'confidence_gate') {
                const threshold = rule.config.threshold ?? 0.45;
                triggered = confidence < threshold;
            } else {
                triggered = this.checkRule(rule, output);
            }

            if (triggered) {
                triggeredRules.push(rule.name);
                if (rule.action === 'block' || rule.action === 'handoff') {
                    finalAction = rule.action;
                    break;
                }
                if (rule.action === 'rephrase') {
                    finalAction = 'rephrase';
                    rephrased = this.redactPII(output, rule);
                }
            }
        }

        return {
            passed: finalAction === 'allow' || finalAction === 'rephrase',
            action: finalAction,
            triggered_rules: triggeredRules,
            rephrased,
        };
    }

    /**
     * Check a single rule against text. Returns true if rule is triggered.
     */
    private checkRule(rule: GuardrailRule, text: string): boolean {
        const lowerText = text.toLowerCase();

        switch (rule.type) {
            case 'topic_block': {
                const topics: string[] = rule.config.topics || [];
                return topics.some((topic: string) => lowerText.includes(topic.toLowerCase()));
            }

            case 'keyword_filter': {
                const keywords: string[] = rule.config.keywords || [];
                const mode = rule.config.mode || 'exact';
                if (mode === 'regex') {
                    return keywords.some((kw: string) => {
                        try { return new RegExp(kw, 'i').test(text); }
                        catch { return false; }
                    });
                }
                return keywords.some((kw: string) => lowerText.includes(kw.toLowerCase()));
            }

            case 'pii_detection': {
                const detectTypes: string[] = rule.config.detect || ['email', 'phone', 'credit_card'];
                return detectTypes.some((type: string) => {
                    const pattern = PII_PATTERNS[type as keyof typeof PII_PATTERNS];
                    return pattern ? pattern.test(text) : false;
                });
            }

            case 'custom_regex': {
                try {
                    const regex = new RegExp(rule.config.pattern, rule.config.flags || 'i');
                    return regex.test(text);
                } catch {
                    return false;
                }
            }

            default:
                return false;
        }
    }

    /**
     * Redact detected PII from text.
     */
    private redactPII(text: string, rule: GuardrailRule): string {
        let redacted = text;
        const detectTypes: string[] = rule.config.detect || ['email', 'phone', 'credit_card'];
        for (const type of detectTypes) {
            const pattern = PII_PATTERNS[type as keyof typeof PII_PATTERNS];
            if (pattern) {
                redacted = redacted.replace(new RegExp(pattern.source, pattern.flags), `[REDACTED_${type.toUpperCase()}]`);
            }
        }
        return redacted;
    }

    /**
     * Invalidate the cache for a workspace (call after rule CRUD).
     */
    invalidateCache(workspaceId: string) {
        ruleCache.delete(workspaceId);
    }

    // ─── CRUD ──────────────────────────────────────────────────────────

    async createRule(rule: Omit<GuardrailRule, 'id'>): Promise<GuardrailRule> {
        const result = await pool.query(
            `INSERT INTO guardrail_rules (workspace_id, name, type, config, action, priority, enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [rule.workspace_id, rule.name, rule.type, JSON.stringify(rule.config), rule.action, rule.priority, rule.enabled]
        );
        this.invalidateCache(rule.workspace_id);
        return result.rows[0];
    }

    async updateRule(id: string, updates: Partial<GuardrailRule>): Promise<GuardrailRule> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (updates.name !== undefined) { setClauses.push(`name = $${idx++}`); values.push(updates.name); }
        if (updates.type !== undefined) { setClauses.push(`type = $${idx++}`); values.push(updates.type); }
        if (updates.config !== undefined) { setClauses.push(`config = $${idx++}`); values.push(JSON.stringify(updates.config)); }
        if (updates.action !== undefined) { setClauses.push(`action = $${idx++}`); values.push(updates.action); }
        if (updates.priority !== undefined) { setClauses.push(`priority = $${idx++}`); values.push(updates.priority); }
        if (updates.enabled !== undefined) { setClauses.push(`enabled = $${idx++}`); values.push(updates.enabled); }

        if (setClauses.length === 0) throw new Error('No fields to update');

        values.push(id);
        const result = await pool.query(
            `UPDATE guardrail_rules SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );

        if (result.rows.length === 0) throw new Error('Guardrail rule not found');
        this.invalidateCache(result.rows[0].workspace_id);
        return result.rows[0];
    }

    async deleteRule(id: string): Promise<void> {
        const result = await pool.query(
            `DELETE FROM guardrail_rules WHERE id = $1 RETURNING workspace_id`,
            [id]
        );
        if (result.rows.length > 0) {
            this.invalidateCache(result.rows[0].workspace_id);
        }
    }
}

export const guardrailsService = new GuardrailsService();
