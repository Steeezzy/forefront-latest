import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getStructuredIntentOutput } from '../../services/llm.service.js';
import { handleAIResponse } from '../../services/ai-action-handler.service.js';
import { evaluateAutomationIngress } from './backpressure.service.js';

const executeSchema = z.object({
  workspace_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  customer_phone: z.string().optional(),
  message: z.string().min(2),
  ai_output: z.object({
    intent: z.string(),
    entities: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

export async function aiActionsRoutes(app: FastifyInstance) {
  app.post('/intent/execute', async (request, reply) => {
    try {
      const body = executeSchema.parse(request.body || {});

      const ingressDecision = await evaluateAutomationIngress(body.workspace_id);
      if (!ingressDecision.allowed) {
        reply.header('Retry-After', String(Math.ceil(ingressDecision.retryAfterMs / 1000)));
        return reply.code(ingressDecision.statusCode || 503).send({
          success: false,
          error: `Automation ingress throttled: ${ingressDecision.reason}`,
          backpressure: {
            reason: ingressDecision.reason,
            mode: ingressDecision.mode,
            retryAfterMs: ingressDecision.retryAfterMs,
            snapshot: ingressDecision.snapshot,
          },
        });
      }

      if (ingressDecision.deferMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, ingressDecision.deferMs));
      }

      const aiOutput = body.ai_output || await getStructuredIntentOutput({
        workspaceId: body.workspace_id,
        message: body.message,
      });

      const result = await handleAIResponse(aiOutput, {
        workspaceId: body.workspace_id,
        customerId: body.customer_id || null,
        customerPhone: body.customer_phone || null,
      });

      return reply.send({
        success: true,
        data: {
          ai_output: aiOutput,
          result,
        },
      });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });
}
