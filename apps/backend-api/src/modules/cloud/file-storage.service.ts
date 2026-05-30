import { pool } from '../../config/db.js';

export interface StoredFile {
  id: string;
  workspace_id: string;
  name: string;
  folder: string;
  file_type: string;
  size_bytes: number;
  cdn_url: string;
  r2_key: string;
  uploaded_at: string;
}

export class FileStorageService {
  async listFiles(workspaceId: string, folder?: string): Promise<StoredFile[]> {
    const query = folder
      ? `SELECT * FROM workspace_files WHERE workspace_id = $1 AND folder = $2 ORDER BY uploaded_at DESC`
      : `SELECT * FROM workspace_files WHERE workspace_id = $1 ORDER BY uploaded_at DESC`;
    const params = folder ? [workspaceId, folder] : [workspaceId];
    const { rows } = await pool.query(query, params);
    return rows;
  }

  async getFileById(workspaceId: string, fileId: string): Promise<StoredFile | null> {
    const { rows } = await pool.query(
      `SELECT * FROM workspace_files WHERE id = $1 AND workspace_id = $2`,
      [fileId, workspaceId]
    );
    return rows[0] ?? null;
  }

  async getStorageUsage(workspaceId: string): Promise<{ fileCount: number; totalBytes: number }> {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS file_count, COALESCE(SUM(size_bytes), 0) AS total_bytes
       FROM workspace_files WHERE workspace_id = $1`,
      [workspaceId]
    );
    return {
      fileCount: parseInt(rows[0].file_count),
      totalBytes: parseInt(rows[0].total_bytes),
    };
  }

  async registerFile(workspaceId: string, data: {
    name: string;
    folder: string;
    fileType: string;
    sizeBytes: number;
    cdnUrl: string;
    r2Key: string;
  }): Promise<StoredFile> {
    const { rows } = await pool.query(
      `INSERT INTO workspace_files (workspace_id, name, folder, file_type, size_bytes, cdn_url, r2_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [workspaceId, data.name, data.folder, data.fileType, data.sizeBytes, data.cdnUrl, data.r2Key]
    );
    return rows[0];
  }

  async deleteFile(workspaceId: string, fileId: string): Promise<void> {
    await pool.query(
      `DELETE FROM workspace_files WHERE id = $1 AND workspace_id = $2`,
      [fileId, workspaceId]
    );
  }

  async createFolder(workspaceId: string, folderName: string): Promise<void> {
    await pool.query(
      `INSERT INTO workspace_folders (workspace_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [workspaceId, folderName]
    );
  }

  async listFolders(workspaceId: string): Promise<string[]> {
    const { rows } = await pool.query(
      `SELECT DISTINCT folder FROM workspace_files WHERE workspace_id = $1 ORDER BY folder`,
      [workspaceId]
    );
    const defaultFolders = ['images', 'documents', 'videos', 'public'];
    const dbFolders = rows.map((r: any) => r.folder).filter(Boolean);
    return [...new Set([...defaultFolders, ...dbFolders])];
  }

  async getUploadPresignedUrl(
    workspaceId: string,
    fileName: string,
    folder: string
  ): Promise<{ uploadUrl: string; cdnUrl: string; r2Key: string }> {
    const r2Key = `${workspaceId}/${folder}/${Date.now()}-${fileName}`;
    const cdnUrl = `https://cdn.qestron.io/${r2Key}`;
    // In production this would call Cloudflare R2 SDK to generate a real presigned PUT URL
    const uploadUrl = `https://r2-upload.qestron.io/${r2Key}?token=mock`;
    return { uploadUrl, cdnUrl, r2Key };
  }
}
