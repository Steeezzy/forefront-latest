/**
 * Workflow Routes — CRUD + management for backend workflow automations.
 *
 * @route GET    /api/workflows           — list all workflows
 * @route POST   /api/workflows           — create workflow
 * @route GET    /api/workflows/templates  — list pre-built templates
 * @route GET    /api/workflows/:id        — get workflow details
 * @route PUT    /api/workflows/:id        — update workflow
 * @route DELETE /api/workflows/:id        — delete workflow
 * @route POST   /api/workflows/:id/toggle — enable/disable
 * @route POST   /api/workflows/import     — import from JSON
 * @route GET    /api/workflows/:id/export — export to JSON
 * @route GET    /api/workflows/:id/executions — execution history
 * @security JWT
 */
import { FastifyInstance } from 'fastify';
export declare function workflowRoutes(app: FastifyInstance): Promise<void>;
//# sourceMappingURL=workflow.routes.d.ts.map