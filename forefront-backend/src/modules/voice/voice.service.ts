import { pool } from '../../config/db.js';

export class VoiceAgentService {
    async getAgent(agentId: string, workspaceId: string) {
        try {
            const result = await pool.query(
                `SELECT * FROM voice_agents 
                 WHERE id = $1 AND workspace_id = $2`,
                [agentId, workspaceId]
            );
            return result.rows[0] || null;
        } catch (error: any) {
            console.error('VoiceAgentService.getAgent error:', error);
            throw error;
        }
    }

    async listAgents(workspaceId: string) {
        try {
            const result = await pool.query(
                `SELECT * FROM voice_agents 
                 WHERE workspace_id = $1 
                 ORDER BY created_at DESC`,
                [workspaceId]
            );
            return result.rows;
        } catch (error: any) {
            console.error('VoiceAgentService.listAgents error:', error);
            throw error;
        }
    }

    async incrementCallCount(agentId: string) {
        try {
            await pool.query(
                `UPDATE voice_agents 
                 SET call_count = COALESCE(call_count, 0) + 1 
                 WHERE id = $1`,
                [agentId]
            );
        } catch (error: any) {
            console.error('VoiceAgentService.incrementCallCount error:', error);
        }
    }
}
