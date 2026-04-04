import { pool } from '../../config/db.js';
import {
  createCustomer,
  getCustomerByPhone,
  logInteraction,
} from '../../services/crm.service.js';
import {
  getStructuredIntentOutput,
  type StructuredIntentOutput,
} from '../../services/llm.service.js';
import { handleAIResponse } from '../../services/ai-action-handler.service.js';
import { emitEvent } from '../../services/event.service.js';

type Channel = 'voice' | 'chat' | 'whatsapp';

export interface WorkspaceCoreOrchestratorInput {
  workspace_id: string;
  message: string;
  channel?: Channel;
  customer_id?: string;
  customer_phone?: string;
  customer_name?: string;
  context?: Record<string, any>;
  ai_output?: StructuredIntentOutput;
}

interface CustomerResolution {
  customer: any | null;
  created: boolean;
}

function buildAssistantReply(
  aiOutput: StructuredIntentOutput,
  actionResult: Record<string, any>
): string {
  if (actionResult?.action === 'appointment.created' && actionResult?.appointment) {
    const appointment = actionResult.appointment;
    const service = appointment.service || aiOutput.entities?.service || 'service';
    const dateText = appointment.date || aiOutput.entities?.date;
    return `Booked ${service} on ${dateText}.`;
  }

  if (aiOutput.intent === 'unknown') {
    return 'I noted your message and will route it to the right workflow.';
  }

  return `Intent ${aiOutput.intent} processed.`;
}

async function getCustomerById(customerId: string, workspaceId: string) {
  const result = await pool.query(
    `SELECT *
     FROM customers
     WHERE id = $1
       AND workspace_id = $2
     LIMIT 1`,
    [customerId, workspaceId]
  );

  return result.rows[0] || null;
}

async function resolveCustomer(input: WorkspaceCoreOrchestratorInput): Promise<CustomerResolution> {
  if (input.customer_id) {
    const customer = await getCustomerById(input.customer_id, input.workspace_id);
    if (!customer) {
      throw new Error('customer_id does not belong to workspace');
    }

    return { customer, created: false };
  }

  if (!input.customer_phone) {
    return { customer: null, created: false };
  }

  const existing = await getCustomerByPhone(input.customer_phone, input.workspace_id);
  if (existing) {
    return { customer: existing, created: false };
  }

  try {
    const createdCustomer = await createCustomer({
      workspace_id: input.workspace_id,
      name: input.customer_name,
      phone: input.customer_phone,
      lifecycle_stage: 'lead',
    });

    return { customer: createdCustomer, created: true };
  } catch (error: any) {
    // Handle race condition when two turns create the same phone simultaneously.
    if (error?.code === '23505') {
      const customer = await getCustomerByPhone(input.customer_phone, input.workspace_id);
      return { customer, created: false };
    }

    throw error;
  }
}

export async function processWorkspaceCoreTurn(input: WorkspaceCoreOrchestratorInput) {
  if (!input.workspace_id) {
    throw new Error('workspace_id is required');
  }

  const channel = input.channel || 'chat';
  const customerResolution = await resolveCustomer(input);
  const customerId = customerResolution.customer?.id || null;

  if (customerResolution.created && customerId) {
    await emitEvent({
      workspace_id: input.workspace_id,
      type: 'customer.created',
      payload: {
        customer_id: customerId,
        phone: input.customer_phone || null,
      },
    });
  }

  const inboundInteraction = await logInteraction({
    workspace_id: input.workspace_id,
    customer_id: customerId,
    channel,
    message: input.message,
    metadata: {
      phase: 'inbound',
      context: input.context || {},
    },
  });

  let aiOutput = input.ai_output;
  let aiError: string | null = null;

  if (!aiOutput) {
    try {
      aiOutput = await getStructuredIntentOutput({
        workspaceId: input.workspace_id,
        message: input.message,
        context: {
          ...(input.context || {}),
          channel,
          customer_id: customerId,
        },
      });
    } catch (error: any) {
      aiError = error?.message || 'intent_extraction_failed';
      aiOutput = {
        intent: 'unknown',
        entities: {},
      };
    }
  }

  const actionResult = await handleAIResponse(aiOutput, {
    workspaceId: input.workspace_id,
    customerId,
    customerPhone: customerResolution.customer?.phone || input.customer_phone || null,
  });

  const assistantReply = buildAssistantReply(aiOutput, actionResult);

  const outboundInteraction = await logInteraction({
    workspace_id: input.workspace_id,
    customer_id: customerId,
    channel,
    response: assistantReply,
    intent: aiOutput.intent,
    metadata: {
      phase: 'outbound',
      entities: aiOutput.entities || {},
      action: actionResult?.action || 'no-op',
      ai_error: aiError,
    },
  });

  const turnEvent = await emitEvent({
    workspace_id: input.workspace_id,
    type: 'orchestrator.turn.processed',
    payload: {
      customer_id: customerId,
      channel,
      intent: aiOutput.intent,
      action: actionResult?.action || 'no-op',
      inbound_interaction_id: inboundInteraction.id,
      outbound_interaction_id: outboundInteraction.id,
      ai_error: aiError,
    },
  });

  return {
    customer: customerResolution.customer,
    ai_output: aiOutput,
    action_result: actionResult,
    interactions: {
      inbound: inboundInteraction,
      outbound: outboundInteraction,
    },
    event: turnEvent,
    response: assistantReply,
  };
}