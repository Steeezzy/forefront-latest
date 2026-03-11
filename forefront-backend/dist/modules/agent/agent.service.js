import { pool } from '../../config/db.js';
export class AgentService {
    async updateConfig(workspaceId, agentId, data) {
        const client = await pool.connect();
        try {
            // 1. Fetch current agent data to merge with updates for prompt generation
            // We need the full picture to generate a consistent system prompt
            const currentRes = await client.query('SELECT * FROM agents WHERE id = $1', [agentId]);
            const current = currentRes.rows[0];
            if (!current)
                throw new Error("Agent not found");
            const merged = { ...current, ...data };
            // 2. Generate System Prompt
            const system_prompt = `
You are ${merged.name}, an AI support agent.
Your Tone: ${merged.tone}.
Your Goal: ${merged.goal}.

INSTRUCTIONS:
- You must answer ONLY based on the provided context chunks.
- If the answer is not found, reply exactly with: "${merged.fallback_message || "I'm not sure, let me check."}".
- Do not make up facts.
            `.trim();
            // 3. Build Query dynamically
            const updates = [];
            const values = [];
            let idx = 1;
            if (data.name) {
                updates.push(`name = $${idx++}`);
                values.push(data.name);
            }
            if (data.tone) {
                updates.push(`tone = $${idx++}`);
                values.push(data.tone);
            }
            if (data.goal) {
                updates.push(`goal = $${idx++}`);
                values.push(data.goal);
            }
            if (data.first_message) {
                updates.push(`first_message = $${idx++}`);
                values.push(data.first_message);
            }
            if (data.fallback_message) {
                updates.push(`fallback_message = $${idx++}`);
                values.push(data.fallback_message);
            }
            if (data.is_active !== undefined) {
                updates.push(`is_active = $${idx++}`);
                values.push(data.is_active);
            }
            // Always update system prompt to ensure it reflects the latest state of other fields
            updates.push(`system_prompt = $${idx++}`);
            values.push(system_prompt);
            if (updates.length === 0)
                return current; // No updates
            // Add identifiers
            values.push(agentId);
            values.push(workspaceId);
            const query = `
                UPDATE agents 
                SET ${updates.join(', ')} 
                WHERE id = $${idx++} AND workspace_id = $${idx++} 
                RETURNING *
            `;
            const res = await client.query(query, values);
            return res.rows[0];
        }
        finally {
            client.release();
        }
    }
    async getAgent(workspaceId, agentId) {
        const res = await pool.query('SELECT * FROM agents WHERE id = $1 AND workspace_id = $2', [agentId, workspaceId]);
        return res.rows[0];
    }
    // Helper to generic create/get primary agent if not exists
    async ensureAgent(workspaceId) {
        const res = await pool.query('SELECT * FROM agents WHERE workspace_id = $1 LIMIT 1', [workspaceId]);
        if (res.rows.length > 0)
            return res.rows[0];
        // Create default
        const defaultPrompt = `You are a helpful support agent. Your goal is to answer questions.`;
        const insert = await pool.query(`
            INSERT INTO agents (workspace_id, name, tone, goal, system_prompt, is_active)
            VALUES ($1, 'Support Bot', 'helpful', 'answer questions', $2, true)
            RETURNING *
        `, [workspaceId, defaultPrompt]);
        return insert.rows[0];
    }
}
//# sourceMappingURL=agent.service.js.map