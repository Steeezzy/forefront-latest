/**
 * Lyro AI Routes — Chat, sessions, handoffs, and guardrail management.
 *
 * @route POST   /api/lyro/chat              — AI chat with RAG pipeline
 * @route GET    /api/lyro/sessions/:id       — get session
 * @route DELETE /api/lyro/sessions/:id       — clear session
 * @route GET    /api/lyro/handoffs           — pending handoffs
 * @route PUT    /api/lyro/handoffs/:id/accept  — accept handoff
 * @route PUT    /api/lyro/handoffs/:id/resolve — resolve handoff
 * @route GET    /api/lyro/guardrail-rules    — list rules
 * @route POST   /api/lyro/guardrail-rules    — create rule
 * @route PUT    /api/lyro/guardrail-rules/:id — update rule
 * @route DELETE /api/lyro/guardrail-rules/:id — delete rule
 * @security JWT
 */
import { FastifyInstance } from 'fastify';
export declare function lyroRoutes(app: FastifyInstance): Promise<void>;
//# sourceMappingURL=lyro.routes.d.ts.map