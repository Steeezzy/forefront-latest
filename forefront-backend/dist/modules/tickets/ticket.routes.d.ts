/**
 * Ticket Routes — RESTful API for the ticketing system.
 *
 * @route GET    /api/tickets          — list with filtering
 * @route POST   /api/tickets          — create ticket
 * @route GET    /api/tickets/stats    — dashboard metrics
 * @route GET    /api/tickets/:id      — detail with comments
 * @route PATCH  /api/tickets/:id      — update status/priority/tags
 * @route POST   /api/tickets/:id/assign   — assign to agent
 * @route POST   /api/tickets/:id/comments — add comment/note
 * @route POST   /api/tickets/:id/resolve  — resolve
 * @route POST   /api/tickets/from-conversation — convert conversation to ticket
 * @security JWT
 */
import { FastifyInstance } from 'fastify';
export declare function ticketRoutes(app: FastifyInstance): Promise<void>;
//# sourceMappingURL=ticket.routes.d.ts.map