import { query } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { PLANS, type PlanType } from '../../config/plans.js';

export class UsageService {
    async incrementMessageCount(workspaceId: string) {
        // 1. Get Subscription & Plan
        const subRes = await query(
            'SELECT plan_id, current_period_start FROM workspaces WHERE id = $1',
            [workspaceId]
        );
        const planId = (subRes.rows[0]?.plan_id || 'free') as PlanType;
        const periodStart = subRes.rows[0]?.current_period_start || new Date(0); // Default to epoch if null
        const planConfig = PLANS[planId] || PLANS.free;

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
        if (currentUsage >= planConfig.messageLimit) {
            await redis.set(`workspace_limit_reached:${workspaceId}`, 'true');
            console.log(`Limit reached for workspace ${workspaceId}. Locked.`);
        }
    }

    async getUsage(workspaceId: string) {
        const subRes = await query(
            'SELECT plan_id, current_period_start, current_period_end, subscription_status FROM workspaces WHERE id = $1',
            [workspaceId]
        );

        if (subRes.rows.length === 0) throw new Error('Workspace not found');

        const workspace = subRes.rows[0];
        const planId = (workspace.plan_id || 'free') as PlanType;
        const planConfig = PLANS[planId] || PLANS.free;
        const periodStart = workspace.current_period_start || new Date(0);

        const countRes = await query(
            'SELECT SUM(message_count) as total FROM usage_logs WHERE workspace_id = $1 AND recorded_at >= $2',
            [workspaceId, periodStart]
        );

        const used = parseInt(countRes.rows[0]?.total || '0');

        return {
            plan: planConfig,
            status: workspace.subscription_status,
            periodEnd: workspace.current_period_end,
            used,
            limit: planConfig.messageLimit,
            remaining: Math.max(planConfig.messageLimit - used, 0)
        };
    }

    async checkLimit(workspaceId: string): Promise<boolean> {
        // Redis First
        const isRateLimited = await redis.get(`workspace_limit_reached:${workspaceId}`);
        if (isRateLimited) return true;

        // DB Fallback (Optional, but safe)
        const usage = await this.getUsage(workspaceId);
        if (usage.used >= usage.limit) {
            await redis.set(`workspace_limit_reached:${workspaceId}`, 'true');
            return true;
        }

        return false;
    }
    async trackTokens(workspaceId: string, tokens: number) {
        console.log(`Tracking tokens for ${workspaceId}: ${tokens}`);
    }
}
