import { pool } from '../../config/db.js';

export interface WebPage {
  id: string;
  workspace_id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  blocks: BlockData[];
  seo_title: string;
  seo_description: string;
  og_image: string | null;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface BlockData {
  id: string;
  type: string;
  props: Record<string, any>;
  order: number;
}

export class WebsiteService {
  async listPages(workspaceId: string): Promise<WebPage[]> {
    const { rows } = await pool.query(
      `SELECT id, workspace_id, title, slug, status, seo_title, seo_description, og_image, views, created_at, updated_at,
              jsonb_array_length(blocks) as section_count
       FROM website_pages WHERE workspace_id = $1 ORDER BY updated_at DESC`,
      [workspaceId]
    );
    return rows;
  }

  async createPage(workspaceId: string, data: { title: string; slug: string }): Promise<WebPage> {
    const { rows } = await pool.query(
      `INSERT INTO website_pages (workspace_id, title, slug, blocks) VALUES ($1, $2, $3, '[]') RETURNING *`,
      [workspaceId, data.title, data.slug]
    );
    return rows[0];
  }

  async getPage(workspaceId: string, pageId: string): Promise<WebPage | null> {
    const { rows } = await pool.query(
      `SELECT * FROM website_pages WHERE id = $1 AND workspace_id = $2`,
      [pageId, workspaceId]
    );
    return rows[0] || null;
  }

  async saveBlocks(workspaceId: string, pageId: string, blocks: BlockData[]): Promise<WebPage> {
    const { rows } = await pool.query(
      `UPDATE website_pages SET blocks = $1, updated_at = NOW() WHERE id = $2 AND workspace_id = $3 RETURNING *`,
      [JSON.stringify(blocks), pageId, workspaceId]
    );
    return rows[0];
  }

  async publishPage(workspaceId: string, pageId: string): Promise<void> {
    await pool.query(
      `UPDATE website_pages SET status = 'published', updated_at = NOW() WHERE id = $1 AND workspace_id = $2`,
      [pageId, workspaceId]
    );
  }

  async unpublishPage(workspaceId: string, pageId: string): Promise<void> {
    await pool.query(
      `UPDATE website_pages SET status = 'draft', updated_at = NOW() WHERE id = $1 AND workspace_id = $2`,
      [pageId, workspaceId]
    );
  }

  async updateSeo(workspaceId: string, pageId: string, seo: { title: string; description: string; ogImage?: string }): Promise<void> {
    await pool.query(
      `UPDATE website_pages SET seo_title = $1, seo_description = $2, og_image = $3, updated_at = NOW()
       WHERE id = $4 AND workspace_id = $5`,
      [seo.title, seo.description, seo.ogImage || null, pageId, workspaceId]
    );
  }

  async deletePage(workspaceId: string, pageId: string): Promise<void> {
    await pool.query(
      `DELETE FROM website_pages WHERE id = $1 AND workspace_id = $2`,
      [pageId, workspaceId]
    );
  }

  async getPublishedBySlug(slug: string): Promise<WebPage | null> {
    const { rows } = await pool.query(
      `SELECT * FROM website_pages WHERE slug = $1 AND status = 'published'`,
      [slug]
    );
    if (rows[0]) {
      // Increment views asynchronously (fire and forget)
      pool.query(`UPDATE website_pages SET views = views + 1 WHERE id = $1`, [rows[0].id]).catch(() => {});
    }
    return rows[0] || null;
  }
}
