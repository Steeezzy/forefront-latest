/**
 * Cloud File Storage Routes
 *
 * @route GET    /api/cloud/files                   — list files (optional ?folder=)
 * @route GET    /api/cloud/files/folders           — list available folders
 * @route GET    /api/cloud/files/usage             — storage usage stats
 * @route POST   /api/cloud/files/presigned-url     — get R2 presigned upload URL
 * @route POST   /api/cloud/files/register          — register uploaded file metadata
 * @route DELETE /api/cloud/files/:id               — delete file record
 * @security JWT
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware.js';
import { FileStorageService } from './file-storage.service.js';

const fileStorageService = new FileStorageService();

const registerFileSchema = z.object({
  name: z.string().min(1).max(255),
  folder: z.string().min(1).max(64).default('root'),
  fileType: z.string().min(1).max(64),
  sizeBytes: z.number().int().positive(),
  cdnUrl: z.string().url(),
  r2Key: z.string().min(1),
});

const presignedUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  folder: z.string().min(1).max(64).default('root'),
});

const createFolderSchema = z.object({
  name: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/, 'Folder name must be lowercase alphanumeric'),
});

export async function fileStorageRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ─── List Files ────────────────────────────────────────────────────────

  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const query = req.query as Record<string, string>;
      const folder = query.folder ?? undefined;
      const files = await fileStorageService.listFiles(workspaceId, folder);

      return reply.send({ success: true, data: files });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // ─── List Folders ──────────────────────────────────────────────────────

  app.get('/folders', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const folders = await fileStorageService.listFolders(workspaceId);
      return reply.send({ success: true, data: folders });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // ─── Storage Usage ─────────────────────────────────────────────────────

  app.get('/usage', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const usage = await fileStorageService.getStorageUsage(workspaceId);
      return reply.send({ success: true, data: usage });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // ─── Get Presigned Upload URL ──────────────────────────────────────────

  app.post('/presigned-url', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { fileName, folder } = presignedUrlSchema.parse(req.body);
      const result = await fileStorageService.getUploadPresignedUrl(workspaceId, fileName, folder);

      return reply.send({ success: true, data: result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ success: false, error: 'Validation failed', details: error.errors });
      }
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // ─── Register Uploaded File ────────────────────────────────────────────

  app.post('/register', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const data = registerFileSchema.parse(req.body);
      const file = await fileStorageService.registerFile(workspaceId, data);

      return reply.code(201).send({ success: true, data: file });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ success: false, error: 'Validation failed', details: error.errors });
      }
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // ─── Create Folder ─────────────────────────────────────────────────────

  app.post('/folders', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { name } = createFolderSchema.parse(req.body);
      await fileStorageService.createFolder(workspaceId, name);

      return reply.code(201).send({ success: true, message: `Folder '${name}' created` });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ success: false, error: 'Validation failed', details: error.errors });
      }
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // ─── Delete File ───────────────────────────────────────────────────────

  app.delete('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      await fileStorageService.deleteFile(workspaceId, id);

      return reply.send({ success: true, message: 'File deleted' });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });
}
