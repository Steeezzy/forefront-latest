import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WebsiteService } from './website.service.js';
import { authenticate } from '../auth/auth.middleware.js';

const websiteService = new WebsiteService();

export async function websiteRoutes(fastify: FastifyInstance) {

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS (no auth)
  // ═══════════════════════════════════════════════════════════════════

  // Serve published page by slug — used by public-facing frontend
  fastify.get('/published/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };
    const page = await websiteService.getPublishedBySlug(`/${slug}`);
    if (!page) {
      return reply.code(404).send({ error: 'Page not found' });
    }
    return reply.send({ success: true, page });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PROTECTED ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════

  fastify.register(async function protectedRoutes(app: FastifyInstance) {
    app.addHook('onRequest', authenticate);

    // List all pages for the workspace
    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      try {
        const pages = await websiteService.listPages(workspaceId);
        return reply.send({ success: true, pages });
      } catch (err: any) {
        return reply.code(500).send({ error: err.message });
      }
    });

    // Create a new page
    app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { title, slug } = request.body as { title: string; slug: string };
      if (!title || !slug) {
        return reply.code(400).send({ error: 'title and slug are required' });
      }

      try {
        const page = await websiteService.createPage(workspaceId, { title, slug });
        return reply.code(201).send({ success: true, page });
      } catch (err: any) {
        if (err.code === '23505') {
          return reply.code(409).send({ error: 'A page with this slug already exists' });
        }
        return reply.code(500).send({ error: err.message });
      }
    });

    // Get a single page with all blocks
    app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = request.params as { id: string };

      try {
        const page = await websiteService.getPage(workspaceId, id);
        if (!page) return reply.code(404).send({ error: 'Page not found' });
        return reply.send({ success: true, page });
      } catch (err: any) {
        return reply.code(500).send({ error: err.message });
      }
    });

    // Save/update blocks for a page
    app.put('/:id/blocks', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = request.params as { id: string };
      const { blocks } = request.body as { blocks: any[] };

      if (!Array.isArray(blocks)) {
        return reply.code(400).send({ error: 'blocks must be an array' });
      }

      try {
        const page = await websiteService.saveBlocks(workspaceId, id, blocks);
        if (!page) return reply.code(404).send({ error: 'Page not found' });
        return reply.send({ success: true, page });
      } catch (err: any) {
        return reply.code(500).send({ error: err.message });
      }
    });

    // Publish a page
    app.patch('/:id/publish', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = request.params as { id: string };

      try {
        await websiteService.publishPage(workspaceId, id);
        return reply.send({ success: true });
      } catch (err: any) {
        return reply.code(500).send({ error: err.message });
      }
    });

    // Unpublish a page
    app.patch('/:id/unpublish', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = request.params as { id: string };

      try {
        await websiteService.unpublishPage(workspaceId, id);
        return reply.send({ success: true });
      } catch (err: any) {
        return reply.code(500).send({ error: err.message });
      }
    });

    // Update SEO metadata
    app.patch('/:id/seo', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = request.params as { id: string };
      const { title, description, ogImage } = request.body as { title: string; description: string; ogImage?: string };

      try {
        await websiteService.updateSeo(workspaceId, id, { title, description, ogImage });
        return reply.send({ success: true });
      } catch (err: any) {
        return reply.code(500).send({ error: err.message });
      }
    });

    // Delete a page
    app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = request.params as { id: string };

      try {
        await websiteService.deletePage(workspaceId, id);
        return reply.send({ success: true });
      } catch (err: any) {
        return reply.code(500).send({ error: err.message });
      }
    });
  });
}
