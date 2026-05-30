import { pool } from '../../config/db.js';
import { anthropicManagedAgentService } from '../../services/anthropic-managed-agent.service.js';

export class ManagedAgentsService {
    async getStatus(workspaceId: string) {
        const result = await pool.query(
            'SELECT managed_agents_enabled FROM workspaces WHERE id = $1',
            [workspaceId]
        );
        return {
            enabled: result.rows[0]?.managed_agents_enabled || false,
            model: process.env.ANTHROPIC_MANAGED_AGENTS_MODEL || 'claude-3-5-sonnet-20240620'
        };
    }

    async toggle(workspaceId: string, enabled: boolean) {
        await pool.query(
            'UPDATE workspaces SET managed_agents_enabled = $1 WHERE id = $2',
            [enabled, workspaceId]
        );
        return { enabled };
    }

    async logRun(data: {
        workspaceId: string;
        sessionId: string;
        kind: string;
        prompt?: string;
        result?: string;
        durationMs?: number;
        status?: string;
        error?: string;
    }) {
        await pool.query(
            `INSERT INTO managed_agent_runs 
             (workspace_id, session_id, kind, prompt, result, duration_ms, status, error)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                data.workspaceId,
                data.sessionId,
                data.kind,
                data.prompt,
                data.result,
                data.durationMs,
                data.status || 'completed',
                data.error
            ]
        );
    }

    async listRuns(workspaceId: string, page: number = 1, limit: number = 20) {
        const offset = (page - 1) * limit;
        const result = await pool.query(
            `SELECT * FROM managed_agent_runs 
             WHERE workspace_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [workspaceId, limit, offset]
        );
        
        const count = await pool.query(
            'SELECT COUNT(*) FROM managed_agent_runs WHERE workspace_id = $1',
            [workspaceId]
        );

        return {
            runs: result.rows,
            total: parseInt(count.rows[0].count),
            page,
            limit
        };
    }

    async getRunDetail(sessionId: string) {
        const result = await pool.query(
            'SELECT * FROM managed_agent_runs WHERE session_id = $1',
            [sessionId]
        );
        if (result.rows.length === 0) throw new Error('Run not found');
        return result.rows[0];
    }
}

export const managedAgentsService = new ManagedAgentsService();
