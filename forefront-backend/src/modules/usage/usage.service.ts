import { query } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { WorkspacePlanService } from '../billing/services/WorkspacePlanService.js';

export class UsageService {
    private workspacePlanService = new WorkspacePlanService();

    async incrementMessageCount(workspaceId: string) {
        // 1. Get Subscription & Plan
        const subRes = await query(
            'SELECT plan_id, current_period_start FROM workspaces WHERE id = $1',
            [workspaceId]
        );
        const periodStart = subRes.rows[0]?.current_period_start || new Date(0); // Default to epoch if null
        const workspacePlan = await this.workspacePlanService.getWorkspacePlan(workspaceId);
        const chatLimit = workspacePlan.meters.chat_messages ?? null;

        // 2. Count Usage since Period Start
        // We need to count matching rows in usage_logs > period_start
        // BUT schema says `usage_logs` has `message_count` (int). 
        // My previous implementation was "INSERT ... VALUES ($1, 1)".
        // So counting rows or summing message_count where recorded_at > periodStart.

        await query(
            'INSERT INTO usage_logs (workspace_id, message_count) VALUES ($1, 1)',
            [workspaceId]
        );

        const countRes = await query(
            'SELECT SUM(message_count) as total FROM usage_logs WHERE workspace_id = $1 AND recorded_at >= $2',
            [workspaceId, periodStart]
        );

        const currentUsage = parseInt(countRes.rows[0]?.total || '0');

        // 3. Check Limit & Lock
        if (chatLimit !== null && currentUsage >= chatLimit) {
            try {
                await redis.set(`workspace_limit_reached:${workspaceId}`, 'true');
                console.log(`Limit reached for workspace ${workspaceId}. Locked.`);
            } catch (err: any) {
                console.warn(`[UsageService] Failed to set limit flag in Redis: ${err.message}`);
            }
        }
    }

    async getUsage(workspaceId: string) {
        const subRes = await query(
            'SELECT plan_id, current_period_start, current_period_end, subscription_status FROM workspaces WHERE id = $1',
            [workspaceId]
        );

        if (subRes.rows.length === 0) throw new Error('Workspace not found');

        const workspace = subRes.rows[0];
        const workspacePlan = await this.workspacePlanService.getWorkspacePlan(workspaceId);
        const periodStart = workspace.current_period_start || new Date(0);

        const countRes = await query(
            'SELECT SUM(message_count) as total FROM usage_logs WHERE workspace_id = $1 AND recorded_at >= $2',
            [workspaceId, periodStart]
        );

        const used = parseInt(countRes.rows[0]?.total || '0');
        const limit = workspacePlan.meters.chat_messages ?? null;

        return {
            plan: {
                id: workspacePlan.basePlan.id,
                name: workspacePlan.basePlan.name,
                price: workspacePlan.basePlan.monthlyPrice,
            },
            status: workspace.subscription_status,
            periodEnd: workspace.current_period_end,
            used,
            limit,
            remaining: limit === null ? null : Math.max(limit - used, 0)
        };
    }

    async checkLimit(workspaceId: string): Promise<boolean> {
        // Redis First (Graceful cache check)
        try {
            const isRateLimited = await redis.get(`workspace_limit_reached:${workspaceId}`);
            if (isRateLimited === 'true') return true;
        } catch (err: any) {
            console.warn(`[UsageService] Redis lookup failed: ${err.message}`);
        }

        // DB Fallback (Safe source of truth)
        try {
            const usage = await this.getUsage(workspaceId);
            if (usage.limit !== null && usage.used >= usage.limit) {
                // Try to cache in Redis, but don't fail if it fails
                redis.set(`workspace_limit_reached:${workspaceId}`, 'true').catch(() => { });
                return true;
            }
        } catch (err: any) {
            console.error(`[UsageService] DB usage check failed: ${err.message}`);
        }

        return false;
    }
    async trackTokens(workspaceId: string, tokens: number) {
        console.log(`Tracking tokens for ${workspaceId}: ${tokens}`);
    }
}
