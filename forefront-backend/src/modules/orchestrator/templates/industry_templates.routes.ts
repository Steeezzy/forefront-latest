import type { FastifyInstance } from 'fastify';

/**
 * Industry Templates Config Endpoint
 * 
 * Provides static configuration data for the "Create Assistant" modal.
 * Defines what each template enables: prompts, specialist agents, and default rules.
 */

export const INDUSTRY_TEMPLATES = {
    real_estate: {
        name: 'Real Estate',
        icon: 'Home',
        system_prompt: `You are an AI assistant for a Real Estate brokerage. 
Your goal is to handle property inquiries and schedule site visits. 
Be professional, welcoming, and gather information about their budget and location preferences.`,
        agents_enabled: ['sales', 'booking', 'crm'],
        default_rules: [
            { trigger_type: 'sentiment_drops', condition_config: { threshold: 0.3 }, action_type: 'escalate_to_human' }
        ],
        description: 'Property inquiries, site visit booking, and lead tracking.'
    },
    healthcare: {
        name: 'Healthcare',
        icon: 'HeartPulse',
        system_prompt: `You are an AI receptionist for a medical clinic. 
Your primary goal is to help patients book appointments and answer basic support questions. 
Do not provide medical advice. Be empathetic and clear.`,
        agents_enabled: ['booking', 'crm', 'escalation'],
        default_rules: [
            { trigger_type: 'keyword_detected', condition_config: { keyword: 'emergency' }, action_type: 'escalate_to_human' },
            { trigger_type: 'keyword_detected', condition_config: { keyword: 'pain' }, action_type: 'create_ticket' }
        ],
        description: 'Patient appointment scheduling, medical support queues.'
    },
    logistics: {
        name: 'Logistics',
        icon: 'Truck',
        system_prompt: `You are an AI logistics coordinator. 
Your goal is to help customers track their shipments and report delivery issues. 
Be efficient and ask for Tracking IDs or order numbers.`,
        agents_enabled: ['crm', 'escalation'],
        default_rules: [
             { trigger_type: 'keyword_detected', condition_config: { keyword: 'delay' }, action_type: 'create_ticket' }
        ],
        description: 'Shipment tracking, delivery support, delays handling.'
    },
    insurance: {
        name: 'Insurance',
        icon: 'ShieldCheck',
        system_prompt: `You are an AI insurance claim assistant. 
Help policyholders file claims, check renewal dates, and answer FAQs. 
Gather policy number and clear description of any incidents.`,
        agents_enabled: ['sales', 'crm', 'escalation'],
        default_rules: [
             { trigger_type: 'keyword_detected', condition_config: { keyword: 'accident' }, action_type: 'escalate_to_human' }
        ],
        description: 'Policy renewal reminders, claim follow-ups.'
    },
    hospitality: {
        name: 'Hospitality',
        icon: 'Hotel',
        system_prompt: `You are an AI concierge for a hotel. 
Help guests with room bookings, amenities inquiries, and booking confirmations. 
Provide a warm, premium service atmosphere.`,
        agents_enabled: ['booking', 'crm', 'sales'],
        default_rules: [
             { trigger_type: 'sentiment_drops', condition_config: { threshold: 0.4 }, action_type: 'escalate_to_human' }
        ],
        description: 'Room bookings, check-in reminders, concierge help.'
    }
};

export default async function templateRoutes(app: FastifyInstance) {
    app.get('/', async () => {
        return { success: true, data: INDUSTRY_TEMPLATES };
    });

    app.get('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const template = (INDUSTRY_TEMPLATES as any)[id];
        if (!template) return reply.status(404).send({ error: 'Template not found' });
        return { success: true, data: template };
    });
}
