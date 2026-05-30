import type { FastifyInstance } from 'fastify';
import { googleReviewsService } from './google-reviews.service.js';
import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';

export async function reviewsRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
        try {
            const { workspaceId } = request.query as { workspaceId: string };
            const ws = await pool.query('SELECT google_place_id, google_api_key FROM workspaces WHERE id = $1', [workspaceId]);
            
            if (!ws.rows.length || !ws.rows[0].google_place_id) {
                return reply.send({ reviews: [], message: 'Google Reviews not configured for this workspace' });
            }

            const { google_place_id, google_api_key } = ws.rows[0];
            const apiKey = google_api_key || process.env.GOOGLE_API_KEY;

            if (!apiKey) {
                return reply.status(400).send({ error: 'Google API key not configured' });
            }

            const reviews = await googleReviewsService.fetchRecentReviews(google_place_id, apiKey);
            const stats = await googleReviewsService.getReviewStats(google_place_id, apiKey);

            return reply.send({ reviews, stats });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });

    app.get('/link', { preHandler: [authenticate] }, async (request, reply) => {
        try {
            const { workspaceId } = request.query as { workspaceId: string };
            const ws = await pool.query('SELECT google_place_id FROM workspaces WHERE id = $1', [workspaceId]);
            
            if (!ws.rows.length || !ws.rows[0].google_place_id) {
                return reply.status(404).send({ error: 'Google Place ID not configured' });
            }

            const link = `https://search.google.com/local/writereview?placeid=${ws.rows[0].google_place_id}`;
            return reply.send({ link });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });
}
