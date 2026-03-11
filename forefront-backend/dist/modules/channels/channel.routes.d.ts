/**
 * Channel Routes — Settings per channel + Email connection management.
 *
 * Endpoints:
 *   GET    /api/channels/settings                       → All channel settings
 *   GET    /api/channels/:channel/settings              → Single channel settings
 *   PUT    /api/channels/:channel/settings              → Update channel settings
 *
 *   GET    /api/channels/email/connections               → List email connections
 *   POST   /api/channels/email/connect-gmail             → Start Gmail OAuth
 *   GET    /api/channels/email/oauth/callback            → Gmail OAuth callback
 *   POST   /api/channels/email/connect-smtp              → Connect SMTP/IMAP
 *   DELETE /api/channels/email/connections/:id            → Disconnect email
 *
 *   POST   /api/channels/conversations/:id/takeover      → Agent takes over
 *   POST   /api/channels/conversations/:id/release       → Release to AI
 *
 *   GET    /api/channels/auto-reply/logs                  → Auto-reply analytics
 */
import { FastifyInstance } from 'fastify';
export declare function channelRoutes(fastify: FastifyInstance): Promise<void>;
//# sourceMappingURL=channel.routes.d.ts.map