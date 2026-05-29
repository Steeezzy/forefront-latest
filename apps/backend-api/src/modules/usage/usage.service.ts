import { query } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { WorkspacePlanService } from '../billing/services/WorkspacePlanService.js';

export class UsageService {
    private workspacePlanService = new WorkspacePlanService();

    /**
     * Unified credit consumption
     * @param featureType 'chat_message', 'voice_minute', 'claude_automation'
     */
    async consumeCredits(workspaceId: string, amount: number = 1, featureType: string = 'chat_message') {
        const costMultiplier = featureType === 'voice_minute' ? 10 : featureType === 'claude_automation' ? 5 : 1;
        const totalCost = amount * costMultiplier;

        // 1. Get Subscription & Period
        const subRes = await query(
            'SELECT plan_id, current_period_start, base_credits, recharge_credits FROM workspaces WHERE id = $1',
            [workspaceId]
        );
        const periodStart = subRes.rows[0]?.current_period_start || new Date(0);
        
        // 2. Log Usage 
        await query(
            'INSERT INTO usage_logs (workspace_id, usage_type, quantity, cost_in_credits) VALUES ($1, $2, $3, $4)',
            [workspaceId, featureType, amount, totalCost]
        );

        // 3. Check Limit & Lock if completely out of credits
        const isLimited = await this.checkLimit(workspaceId);
        if (isLimited) {
            try {
                await redis.set(`workspace_limit_reached:${workspaceId}`, 'true');
                console.log(`Credit limit exhausted for workspace ${workspaceId}. Locked.`);
            } catch (err: any) {
                console.warn(`[UsageService] Failed to set limit flag in Redis: ${err.message}`);
            }
        }
    }

    async getUsage(workspaceId: string) {
        const subRes = await query(
            'SELECT plan_id, current_period_start, current_period_end, subscription_status, base_credits, recharge_credits FROM workspaces WHERE id = $1',
            [workspaceId]
        );

        if (subRes.rows.length === 0) throw new Error('Workspace not found');

        const workspace = subRes.rows[0];
        const workspacePlan = await this.workspacePlanService.getWorkspacePlan(workspaceId);
        const periodStart = workspace.current_period_start || new Date(0);

        // Sum consumed credits in the current billing cycle
        const countRes = await query(
            'SELECT SUM(cost_in_credits) as consumed_credits, SUM(quantity) as raw_quantity, usage_type FROM usage_logs WHERE workspace_id = $1 AND created_at >= $2 GROUP BY usage_type',
            [workspaceId, periodStart]
        );

        let consumedBase = 0;
        const breakdown: Record<string, { consumed: number, cost: number }> = {};
        
        countRes.rows.forEach(row => {
            const cost = parseInt(row.consumed_credits || '0');
            consumedBase += cost;
            breakdown[row.usage_type] = {
                consumed: parseInt(row.raw_quantity || '0'),
                cost
            };
        });

        // Resolve limits
        const monthlyAllowance = (workspacePlan.basePlan as any)?.limits?.monthlyCredits || workspacePlan.meters.chat_messages; // Fallback to chat_messages if `monthlyCredits` undefined in some plans
        const rechargeCredits = parseFloat(workspace.recharge_credits || '0');
        const planBaseCredits = parseFloat(workspace.base_credits || `${monthlyAllowance || 0}`);

        const totalAvailable = planBaseCredits + rechargeCredits;
        const remaining = Math.max(totalAvailable - consumedBase, 0);

        return {
            plan: {
                id: workspacePlan.basePlan.id,
                name: workspacePlan.basePlan.name,
                price: workspacePlan.basePlan.monthlyPrice,
            },
            status: workspace.subscription_status,
            periodEnd: workspace.current_period_end,
            usedCredits: consumedBase,
            totalCredits: totalAvailable,
            rechargeCredits,
            remaining,
            breakdown
        };
    }

    async checkLimit(workspaceId: string): Promise<boolean> {
        try {
            const isRateLimited = await redis.get(`workspace_limit_reached:${workspaceId}`);
            if (isRateLimited === 'true') return true;
        } catch (err: any) {
             // Ignore redis errors
        }

        try {
            const usage = await this.getUsage(workspaceId);
            if (usage.totalCredits !== null && usage.usedCredits >= usage.totalCredits) {
                redis.set(`workspace_limit_reached:${workspaceId}`, 'true').catch(() => { });
                return true;
            }
        } catch (err: any) {
            console.error(`[UsageService] DB usage check failed: ${err.message}`);
        }

        return false;
    }
    
    // Backward compatibility for existing code calling incrementMessageCount
    async incrementMessageCount(workspaceId: string) {
        await this.consumeCredits(workspaceId, 1, 'chat_message');
    }

    async trackTokens(workspaceId: string, tokens: number) {
        console.log(`Tracking tokens for ${workspaceId}: ${tokens}`);
    }
}

