import { pool } from '../../config/db.js';

export class WorkspaceService {
  async createWorkspace(data: any) {
    const wsId = data.workspaceId || require('crypto').randomUUID();
    // Assuming owner_id can be skipped or passed if we have auth context. 
    // We'll insert what we can. Let's assume there is a default placeholder or auth injects it.
    // Since workspaces table requires an owner_id, we should pass it or query a default system admin.
    const res = await pool.query(
      `INSERT INTO workspaces (id, name, owner_id, industry_id, business_name, phone, timezone, language, status)
       VALUES ($1, $2, (SELECT id FROM users LIMIT 1), $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        wsId,
        data.businessName || 'New Workspace',
        data.industryId,
        data.businessName,
        data.phone,
        data.timezone || 'US/Eastern',
        data.language || 'en-IN',
        data.status || 'created'
      ]
    );

    // After insert, update the config metadata
    await this.updateConfig(wsId, {
      voice_agent_name: data.voiceAgentName,
      greeting: data.greeting,
      after_hours_message: data.afterHoursMessage,
      chatbot_title: data.chatbotTitle,
      chatbot_welcome: data.chatbotWelcome,
      chatbot_personality: data.chatbotPersonality,
      chatbot_temperature: data.chatbotTemperature
    });

    return await this.getWorkspace(wsId);
  }

  async getWorkspace(id: string) {
    const res = await pool.query(`SELECT * FROM workspaces WHERE id = $1`, [id]);
    if (res.rows.length === 0) throw new Error('Workspace not found');
    return res.rows[0];
  }

  async updateConfig(id: string, updates: any) {
    const keys = Object.keys(updates).filter(k => updates[k] !== undefined);
    if (keys.length === 0) return null;

    const setCalls = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = keys.map(k => updates[k]);

    const res = await pool.query(
      `UPDATE workspaces SET ${setCalls} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return res.rows[0];
  }
}

export const workspaceService = new WorkspaceService();
