import { pool } from '../../config/db.js';
import { generateEmbedding } from '../../utils/embeddings.js';
import { env } from '../../config/env.js';
import { sarvamClient } from '../../services/SarvamClient.js';
export class RagService {
    async resolveAIResponse(workspaceId, userMessage) {
        // 1. Get Embedding for the QUESTION
        const vector = await generateEmbedding(userMessage);
        // 2. Search the "Brain" (Postgres + pgvector)
        // Filter by workspace_id via knowledge_sources
        const vectorQuery = `
            SELECT kv.content_chunk 
            FROM knowledge_vectors kv
            JOIN knowledge_sources ks ON kv.source_id = ks.id
            WHERE ks.agent_id IN (SELECT id FROM agents WHERE workspace_id = $1)
            ORDER BY kv.embedding <=> $2::vector
            LIMIT 3
        `;
        const vectorStr = JSON.stringify(vector);
        const { rows: chunks } = await pool.query(vectorQuery, [workspaceId, vectorStr]);
        const contextText = chunks.map((c) => c.content_chunk).join("\n\n");
        console.log(`RAG: Found ${chunks.length} chunks for workspace ${workspaceId}`);
        // 3. Fetch Agent "Personality"
        const { rows: agents } = await pool.query(`SELECT system_prompt, tone FROM agents WHERE workspace_id = $1 AND is_active = true LIMIT 1`, [workspaceId]);
        // Fallback agent if none exists
        const agent = agents[0] || {
            system_prompt: "You are a helpful support agent.",
            tone: "helpful"
        };
        // 4. Generate Answer (Sarvam AI)
        const systemInstruction = `
${agent.system_prompt}
Tone: ${agent.tone}

USE THIS KNOWLEDGE ONLY:
${contextText || "No specific knowledge found."}

USER QUESTION: ${userMessage}
        `.trim();
        if (!env.SARVAM_API_KEY) {
            console.warn("RAG: No Sarvam API Key. Returning mock.");
            return `[Mock RAG Response] based on ${chunks.length} chunks.`;
        }
        try {
            const result = await sarvamClient.chatCompletion([
                { role: 'user', content: systemInstruction }
            ], {
                temperature: 0.7,
                max_tokens: 500
            });
            return result.choices?.[0]?.message?.content || "I couldn't generate an answer.";
        }
        catch (e) {
            console.error("RAG Generation failed", e.message);
            return "I'm having trouble thinking right now.";
        }
    }
}
