import { pool } from '../../config/db.js';
import crypto from 'crypto';

export interface AppGateway {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  template: string;
  description: string;
  brand_color: string;
  logo_url: string | null;
  features: string[];
  roles: string[];
  app_url: string;
  token: string;
  status: 'active' | 'draft' | 'paused';
  user_count: number;
  daily_active: number;
  created_at: string;
  updated_at: string;
}

export class AppGatewayService {
  private generateToken(appId: string, workspaceId: string): string {
    const payload = Buffer.from(JSON.stringify({ appId, workspaceId, iat: Date.now() })).toString('base64url');
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const secret = process.env.APP_GATEWAY_SECRET || 'qestron-app-gateway-secret';
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
    return `${header}.${payload}.${signature}`;
  }

  async listApps(workspaceId: string): Promise<AppGateway[]> {
    const { rows } = await pool.query(
      `SELECT * FROM app_gateways WHERE workspace_id = $1 ORDER BY created_at DESC`,
      [workspaceId]
    );
    return rows;
  }

  async createApp(workspaceId: string, workspaceSlug: string, data: {
    name: string;
    slug: string;
    template: string;
    description: string;
    brandColor: string;
    logoUrl?: string;
    features: string[];
    roles: string[];
  }): Promise<AppGateway> {
    const appUrl = `https://app.qestron.io/${workspaceSlug}/${data.slug}`;

    const { rows: inserted } = await pool.query(
      `INSERT INTO app_gateways (workspace_id, name, slug, template, description, brand_color, logo_url, features, roles, app_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
       RETURNING *`,
      [
        workspaceId,
        data.name,
        data.slug,
        data.template,
        data.description,
        data.brandColor,
        data.logoUrl || null,
        JSON.stringify(data.features),
        JSON.stringify(data.roles),
        appUrl,
      ]
    );

    const app = inserted[0];
    const token = this.generateToken(app.id, workspaceId);

    const { rows: updated } = await pool.query(
      `UPDATE app_gateways SET token = $1, status = 'active', updated_at = NOW() WHERE id = $2 RETURNING *`,
      [token, app.id]
    );

    return updated[0];
  }

  async getApp(workspaceId: string, appId: string): Promise<AppGateway | null> {
    const { rows } = await pool.query(
      `SELECT * FROM app_gateways WHERE id = $1 AND workspace_id = $2`,
      [appId, workspaceId]
    );
    return rows[0] || null;
  }

  async updateApp(
    workspaceId: string,
    appId: string,
    data: Partial<{
      name: string;
      description: string;
      brandColor: string;
      features: string[];
      roles: string[];
    }>
  ): Promise<AppGateway> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (data.name !== undefined) { updates.push(`name = $${paramIdx++}`); params.push(data.name); }
    if (data.description !== undefined) { updates.push(`description = $${paramIdx++}`); params.push(data.description); }
    if (data.brandColor !== undefined) { updates.push(`brand_color = $${paramIdx++}`); params.push(data.brandColor); }
    if (data.features !== undefined) { updates.push(`features = $${paramIdx++}`); params.push(JSON.stringify(data.features)); }
    if (data.roles !== undefined) { updates.push(`roles = $${paramIdx++}`); params.push(JSON.stringify(data.roles)); }

    updates.push(`updated_at = NOW()`);
    params.push(workspaceId, appId);

    const { rows } = await pool.query(
      `UPDATE app_gateways SET ${updates.join(', ')} WHERE workspace_id = $${paramIdx++} AND id = $${paramIdx++} RETURNING *`,
      params
    );
    return rows[0];
  }

  async regenerateToken(workspaceId: string, appId: string): Promise<string> {
    const newToken = this.generateToken(appId, workspaceId);
    await pool.query(
      `UPDATE app_gateways SET token = $1, updated_at = NOW() WHERE id = $2 AND workspace_id = $3`,
      [newToken, appId, workspaceId]
    );
    return newToken;
  }

  async updateStatus(workspaceId: string, appId: string, status: 'active' | 'paused' | 'draft'): Promise<void> {
    await pool.query(
      `UPDATE app_gateways SET status = $1, updated_at = NOW() WHERE id = $2 AND workspace_id = $3`,
      [status, appId, workspaceId]
    );
  }

  async deleteApp(workspaceId: string, appId: string): Promise<void> {
    await pool.query(
      `DELETE FROM app_gateways WHERE id = $1 AND workspace_id = $2`,
      [appId, workspaceId]
    );
  }

  async validateToken(token: string): Promise<{
    valid: boolean;
    appId?: string;
    workspaceId?: string;
    app?: AppGateway;
  }> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { valid: false };

      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      const { appId, workspaceId } = payload;

      const { rows } = await pool.query(
        `SELECT * FROM app_gateways WHERE id = $1 AND workspace_id = $2 AND token = $3 AND status = 'active'`,
        [appId, workspaceId, token]
      );

      if (!rows[0]) return { valid: false };

      return { valid: true, appId, workspaceId, app: rows[0] };
    } catch {
      return { valid: false };
    }
  }
}
