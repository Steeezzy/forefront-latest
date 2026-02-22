import { pool, query } from '../../config/db.js';
import { z } from 'zod';

export const trackVisitorSchema = z.object({
  workspaceId: z.string().uuid(),
  visitorId: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  currentPage: z.string().optional(),
  browser: z.string().optional(),
  browserVersion: z.string().optional(),
  os: z.string().optional(),
  osVersion: z.string().optional(),
  deviceType: z.string().optional(),
  ipAddress: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  customProperties: z.record(z.string(), z.any()).optional(),
});

export const trackPageViewSchema = z.object({
  visitorId: z.string().uuid(),
  pageUrl: z.string(),
  pageTitle: z.string().optional(),
  referrer: z.string().optional(),
  durationSeconds: z.number().optional(),
});

export class VisitorService {
  async trackVisitor(data: z.infer<typeof trackVisitorSchema>) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if visitor exists
      const existingRes = await client.query(
        'SELECT id, total_visits, first_seen_at FROM visitors WHERE workspace_id = $1 AND visitor_id = $2',
        [data.workspaceId, data.visitorId]
      );
      
      let visitor;
      
      if (existingRes.rows.length > 0) {
        // Update existing visitor
        const existing = existingRes.rows[0];
        
        const updateRes = await client.query(
          `UPDATE visitors SET
            name = COALESCE($1, name),
            email = COALESCE($2, email),
            phone = COALESCE($3, phone),
            last_seen_at = CURRENT_TIMESTAMP,
            total_visits = total_visits + 1,
            current_page = $4,
            browser = COALESCE($5, browser),
            browser_version = COALESCE($6, browser_version),
            os = COALESCE($7, os),
            os_version = COALESCE($8, os_version),
            device_type = COALESCE($9, device_type),
            ip_address = COALESCE($10, ip_address),
            country = COALESCE($11, country),
            city = COALESCE($12, city),
            region = COALESCE($13, region),
            timezone = COALESCE($14, timezone),
            language = COALESCE($15, language),
            referrer = COALESCE($16, referrer),
            utm_source = COALESCE($17, utm_source),
            utm_medium = COALESCE($18, utm_medium),
            utm_campaign = COALESCE($19, utm_campaign),
            custom_properties = COALESCE($20, custom_properties),
            is_online = true,
            last_activity_at = CURRENT_TIMESTAMP
           WHERE id = $21
           RETURNING *`,
          [
            data.name,
            data.email,
            data.phone,
            data.currentPage,
            data.browser,
            data.browserVersion,
            data.os,
            data.osVersion,
            data.deviceType,
            data.ipAddress,
            data.country,
            data.city,
            data.region,
            data.timezone,
            data.language,
            data.referrer,
            data.utmSource,
            data.utmMedium,
            data.utmCampaign,
            JSON.stringify(data.customProperties || {}),
            existing.id,
          ]
        );
        
        visitor = updateRes.rows[0];
      } else {
        // Create new visitor
        const insertRes = await client.query(
          `INSERT INTO visitors
            (workspace_id, visitor_id, name, email, phone, current_page, browser,
             browser_version, os, os_version, device_type, ip_address, country,
             city, region, timezone, language, referrer, utm_source, utm_medium,
             utm_campaign, custom_properties, is_online, last_activity_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                   $15, $16, $17, $18, $19, $20, $21, $22, true, CURRENT_TIMESTAMP)
           RETURNING *`,
          [
            data.workspaceId,
            data.visitorId,
            data.name,
            data.email,
            data.phone,
            data.currentPage,
            data.browser,
            data.browserVersion,
            data.os,
            data.osVersion,
            data.deviceType,
            data.ipAddress,
            data.country,
            data.city,
            data.region,
            data.timezone,
            data.language,
            data.referrer,
            data.utmSource,
            data.utmMedium,
            data.utmCampaign,
            JSON.stringify(data.customProperties || {}),
          ]
        );
        
        visitor = insertRes.rows[0];
      }
      
      await client.query('COMMIT');
      return visitor;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async trackPageView(data: z.infer<typeof trackPageViewSchema>) {
    const result = await query(
      `INSERT INTO page_views (visitor_id, page_url, page_title, referrer, duration_seconds)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.visitorId, data.pageUrl, data.pageTitle, data.referrer, data.durationSeconds]
    );
    
    return result.rows[0];
  }
  
  async setVisitorOffline(visitorId: string) {
    await query(
      `UPDATE visitors SET is_online = false, last_activity_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [visitorId]
    );
  }
  
  async getVisitorById(visitorId: string, workspaceId: string) {
    const result = await query(
      `SELECT v.*,
        (SELECT COUNT(*) FROM conversations c WHERE c.visitor_id = v.id) as conversation_count,
        (SELECT json_agg(pv.* ORDER BY pv.viewed_at DESC) FROM page_views pv WHERE pv.visitor_id = v.id LIMIT 10) as recent_pages
       FROM visitors v
       WHERE v.id = $1 AND v.workspace_id = $2`,
      [visitorId, workspaceId]
    );
    
    return result.rows[0] || null;
  }
  
  async getVisitors(workspaceId: string, options: { online?: boolean; page?: number; limit?: number } = {}) {
    const { online, page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE workspace_id = $1';
    const values: any[] = [workspaceId];
    
    if (online !== undefined) {
      whereClause += ' AND is_online = $2';
      values.push(online);
    }
    
    const result = await query(
      `SELECT * FROM visitors ${whereClause}
       ORDER BY last_activity_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );
    
    return result.rows;
  }
  
  async getOnlineVisitorsCount(workspaceId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) FROM visitors WHERE workspace_id = $1 AND is_online = true',
      [workspaceId]
    );
    
    return parseInt(result.rows[0].count);
  }
}

export const visitorService = new VisitorService();
