/**
 * Copilot Routes — Agent-assist API.
 *
 * @route POST /api/copilot/suggestions    — get AI suggestions for agents
 * @route POST /api/copilot/kb-search      — direct KB search from inbox
 * @route POST /api/copilot/index-document  — chunk + embed + store a document
 * @route DELETE /api/copilot/documents/:id — remove all chunks for a document
 * @security JWT
 */
import { FastifyInstance } from 'fastify';
export declare function copilotRoutes(app: FastifyInstance): Promise<void>;
//# sourceMappingURL=copilot.routes.d.ts.map