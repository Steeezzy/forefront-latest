import { query } from '../../../config/db.js';
import {
    BILLING_MODEL_RECOMMENDATION,
    FEATURE_REGISTRY,
    METER_REGISTRY,
    PLAN_TEMPLATES,
    VOICE_ADDON_TEMPLATES,
    combineFeatures,
    combineMeterDefaults,
    getPlanTemplate,
    getVoiceAddonTemplate,
    normalizeLegacyPlanId,
} from '../catalog.js';

export interface WorkspacePlanOverrideInput {
    basePlanId?: string;
    voiceAddonId?: string;
    meterOverrides?: Record<string, number | null>;
    featureOverrides?: Record<string, boolean>;
    billingPreferences?: Record<string, any>;
}

export class WorkspacePlanService {
    async getWorkspacePlan(workspaceId: string) {
        const [workspaceRes, overrideRes] = await Promise.all([
            query(
                `SELECT id, plan_id, subscription_status, billing_provider, current_period_start, current_period_end
                 FROM workspaces
                 WHERE id = $1
                 LIMIT 1`,
                [workspaceId]
            ),
            query(
                `SELECT base_plan_id, voice_addon_id, meter_overrides, feature_overrides, billing_preferences
                 FROM workspace_plan_overrides
                 WHERE workspace_id = $1
                 LIMIT 1`,
                [workspaceId]
            ).catch(() => ({ rows: [] })),
        ]);

        if (workspaceRes.rows.length === 0) {
            throw new Error('Workspace not found');
        }

        const workspace = workspaceRes.rows[0];
        const override = overrideRes.rows[0];
        const basePlanId = override?.base_plan_id || normalizeLegacyPlanId(workspace.plan_id);
        const voiceAddonId = override?.voice_addon_id || 'voice-none';
        const basePlan = getPlanTemplate(basePlanId);
        const voiceAddon = getVoiceAddonTemplate(voiceAddonId);
        const meterOverrides = override?.meter_overrides || {};
        const featureOverrides = override?.feature_overrides || {};
        const billingPreferences = override?.billing_preferences || {};

        return {
            workspaceId,
            workspacePlanId: workspace.plan_id,
            subscriptionStatus: workspace.subscription_status || 'active',
            billingProvider: workspace.billing_provider || null,
            currentPeriodStart: workspace.current_period_start || null,
            currentPeriodEnd: workspace.current_period_end || null,
            basePlanId,
            voiceAddonId,
            basePlan,
            voiceAddon,
            meterOverrides,
            featureOverrides,
            billingPreferences,
            meters: combineMeterDefaults(basePlan.meterDefaults, voiceAddon.meterDefaults, meterOverrides),
            features: combineFeatures(basePlan.featureIds, voiceAddon.featureIds, featureOverrides),
        };
    }

    async getWorkspaceUsageSnapshot(workspaceId: string, periodStart?: string | Date | null) {
        const [chatUsageRes, voiceUsageRes, voiceAgentRes, knowledgeRes, teamRes] = await Promise.all([
            query(
                `SELECT COALESCE(SUM(message_count), 0) AS total
                 FROM usage_logs
                 WHERE workspace_id = $1
                   AND recorded_at >= COALESCE($2::timestamp, CURRENT_TIMESTAMP - INTERVAL '30 days')`,
                [workspaceId, periodStart || null]
            ),
            query(
                `SELECT
                    COUNT(*) AS sessions,
                    COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - started_at))), 0) AS seconds
                 FROM conversation_sessions
                 WHERE workspace_id = $1
                   AND channel = 'voice'
                   AND started_at >= COALESCE($2::timestamp, CURRENT_TIMESTAMP - INTERVAL '30 days')`,
                [workspaceId, periodStart || null]
            ),
            query('SELECT COUNT(*) AS total FROM voice_agents WHERE workspace_id = $1', [workspaceId]),
            query(
                `SELECT COUNT(*) AS total
                 FROM knowledge_sources ks
                 JOIN agents a ON a.id = ks.agent_id
                 WHERE a.workspace_id = $1`,
                [workspaceId]
            ).catch(() => ({ rows: [{ total: '0' }] })),
            query(
                `SELECT
                    (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1) +
                    (SELECT COUNT(*) FROM workspaces WHERE id = $1) AS total`,
                [workspaceId]
            ).catch(() => ({ rows: [{ total: '1' }] })),
        ]);

        const voiceSeconds = Number(voiceUsageRes.rows[0]?.seconds || 0);

        return {
            chat_messages: Number(chatUsageRes.rows[0]?.total || 0),
            voice_minutes: Math.ceil(voiceSeconds / 60),
            voice_sessions: Number(voiceUsageRes.rows[0]?.sessions || 0),
            voice_agents: Number(voiceAgentRes.rows[0]?.total || 0),
            knowledge_items: Number(knowledgeRes.rows[0]?.total || 0),
            team_members: Number(teamRes.rows[0]?.total || 1),
        };
    }

    async updateWorkspacePlan(workspaceId: string, input: WorkspacePlanOverrideInput) {
        const current = await this.getWorkspacePlan(workspaceId);
        const nextBasePlanId = input.basePlanId ? normalizeLegacyPlanId(input.basePlanId) : current.basePlanId;
        const nextVoiceAddonId = input.voiceAddonId || current.voiceAddonId || 'voice-none';
        const meterOverrides = input.meterOverrides ?? current.meterOverrides ?? {};
        const featureOverrides = input.featureOverrides ?? current.featureOverrides ?? {};
        const billingPreferences = input.billingPreferences ?? current.billingPreferences ?? {};

        await query(
            `INSERT INTO workspace_plan_overrides (
                workspace_id, base_plan_id, voice_addon_id, meter_overrides, feature_overrides, billing_preferences
             ) VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (workspace_id)
             DO UPDATE SET
                base_plan_id = EXCLUDED.base_plan_id,
                voice_addon_id = EXCLUDED.voice_addon_id,
                meter_overrides = EXCLUDED.meter_overrides,
                feature_overrides = EXCLUDED.feature_overrides,
                billing_preferences = EXCLUDED.billing_preferences,
                updated_at = CURRENT_TIMESTAMP`,
            [
                workspaceId,
                nextBasePlanId,
                nextVoiceAddonId,
                JSON.stringify(meterOverrides),
                JSON.stringify(featureOverrides),
                JSON.stringify(billingPreferences),
            ]
        );

        await query(
            `UPDATE workspaces
             SET plan_id = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [nextBasePlanId, workspaceId]
        ).catch(async () => {
            await query('UPDATE workspaces SET plan_id = $1 WHERE id = $2', [nextBasePlanId, workspaceId]);
        });

        return this.getWorkspacePlan(workspaceId);
    }

    getCatalog() {
        return {
            planFamilies: [
                {
                    id: 'customer-service',
                    label: 'Customer service',
                    description: 'Human support workspace with inbox, channels, tickets, and automations.',
                    plans: PLAN_TEMPLATES.filter((plan) => plan.family === 'customer-service'),
                },
                {
                    id: 'conversa-ai',
                    label: 'Conversa AI Agent',
                    description: 'Chat AI plan family for knowledge-backed support and automation.',
                    plans: PLAN_TEMPLATES.filter((plan) => plan.family === 'conversa-ai'),
                },
                {
                    id: 'flows',
                    label: 'Flows',
                    description: 'Visual workflows, templates, and visitor automation.',
                    plans: PLAN_TEMPLATES.filter((plan) => plan.family === 'flows'),
                },
            ],
            voiceAddons: VOICE_ADDON_TEMPLATES,
            features: FEATURE_REGISTRY,
            meters: METER_REGISTRY,
            recommendation: BILLING_MODEL_RECOMMENDATION,
        };
    }
}
