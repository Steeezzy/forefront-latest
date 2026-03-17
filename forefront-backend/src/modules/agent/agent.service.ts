import { pool } from '../../config/db.js';

export class AgentService {
    async getPrimaryAgent(workspaceId: string) {
        const res = await pool.query(
            `WITH agent_vector_counts AS (
                SELECT a.id, COUNT(kv.id)::int AS vector_count
                FROM agents a
                LEFT JOIN knowledge_sources ks ON ks.agent_id = a.id
                LEFT JOIN knowledge_vectors kv ON kv.source_id = ks.id
                WHERE a.workspace_id = $1 AND a.is_active = true
                GROUP BY a.id
            )
            SELECT a.*
            FROM agents a
            JOIN agent_vector_counts avc ON avc.id = a.id
            WHERE a.workspace_id = $1 AND a.is_active = true
            ORDER BY avc.vector_count DESC, a.created_at ASC
            LIMIT 1`,
            [workspaceId]
        );

        return res.rows[0] || null;
    }

    async updateConfig(
        workspaceId: string,
        agentId: string,
        data: {
            name?: string;
            tone?: string;
            goal?: string;
            first_message?: string;
            fallback_message?: string;
            is_active?: boolean;
        }
    ) {
        const client = await pool.connect();
        try {
            // 1. Fetch current agent data to merge with updates for prompt generation
            // We need the full picture to generate a consistent system prompt
            const currentRes = await client.query('SELECT * FROM agents WHERE id = $1', [agentId]);
            const current = currentRes.rows[0];

            if (!current) throw new Error("Agent not found");

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
            const updates: string[] = [];
            const values: any[] = [];
            let idx = 1;

            if (data.name) { updates.push(`name = $${idx++}`); values.push(data.name); }
            if (data.tone) { updates.push(`tone = $${idx++}`); values.push(data.tone); }
            if (data.goal) { updates.push(`goal = $${idx++}`); values.push(data.goal); }
            if (data.first_message) { updates.push(`first_message = $${idx++}`); values.push(data.first_message); }
            if (data.fallback_message) { updates.push(`fallback_message = $${idx++}`); values.push(data.fallback_message); }
            if (data.is_active !== undefined) { updates.push(`is_active = $${idx++}`); values.push(data.is_active); }

            // Always update system prompt to ensure it reflects the latest state of other fields
            updates.push(`system_prompt = $${idx++}`); values.push(system_prompt);

            if (updates.length === 0) return current; // No updates

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

        } finally {
            client.release();
        }
    }

    async getAgent(workspaceId: string, agentId: string) {
        const res = await pool.query(
            'SELECT * FROM agents WHERE id = $1 AND workspace_id = $2',
            [agentId, workspaceId]
        );
        return res.rows[0];
    }

    // Helper to generic create/get primary agent if not exists
    async ensureAgent(workspaceId: string, defaultName = 'Support Bot') {
        const primaryAgent = await this.getPrimaryAgent(workspaceId);
        if (primaryAgent) return primaryAgent;

        // Create default
        const defaultPrompt = `You are a helpful support agent. Your goal is to answer questions.`;
        const insert = await pool.query(`
            INSERT INTO agents (workspace_id, name, tone, goal, system_prompt, is_active)
            VALUES ($1, $2, 'helpful', 'answer questions', $3, true)
            RETURNING *
        `, [workspaceId, defaultName, defaultPrompt]);
        return insert.rows[0];
    }
}
