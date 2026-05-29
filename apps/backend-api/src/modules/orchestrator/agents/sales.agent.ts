import type { AgentInput, AgentOutput } from '../orchestrator.service.js';
import { anthropicManagedAgentService } from '../../../services/anthropic-managed-agent.service.js';

/**
 * SalesAgent
 *
 * Qualifies leads, presents offers, captures interest, and schedules follow-ups.
 * Uses conversation context + customer profile to personalize responses.
 */

export class SalesAgent {
    private sarvamApiKey: string;
    private sarvamBaseUrl: string;

    constructor() {
        this.sarvamApiKey = process.env.SARVAM_API_KEY || '';
        this.sarvamBaseUrl = 'https://api.sarvam.ai/v1';
    }

    async handle(input: AgentInput): Promise<AgentOutput> {
        const message = input.message.toLowerCase();

        if (message.includes('price') || message.includes('cost') || message.includes('how much')) {
            return this.handlePricing(input);
        }

        if (message.includes('demo') || message.includes('trial') || message.includes('try')) {
            return this.handleDemoRequest(input);
        }

        if (message.includes('compare') || message.includes('difference') || message.includes('vs')) {
            return this.handleComparison(input);
        }

        // Default: qualify the lead
        return this.handleLeadQualification(input);
    }

    private async handleLeadQualification(input: AgentInput): Promise<AgentOutput> {
        if (anthropicManagedAgentService.isEnabled()) {
            try {
                const salesPrompt = input.specialistPrompt || `You are a professional sales agent. Your goal is to:
1. Understand the customer's needs
2. Present relevant solutions
3. Qualify their interest level
4. Schedule a follow-up if interested

Be conversational, not pushy. Ask discovery questions. Keep responses under 60 words.`;

                const historyText = input.history
                    .slice(-4)
                    .map((message: any) => `${message.role || 'user'}: ${message.content || ''}`)
                    .join('\n');

                const managed = await anthropicManagedAgentService.runTextTask(
                    `${salesPrompt}

Conversation history:
${historyText || 'None'}

Customer message:
${input.message}

Return only the next best customer-facing reply.`,
                    {
                        title: 'Qestron sales qualification',
                    }
                );

                if (managed.text) {
                    return {
                        reply: managed.text,
                        actions: ['lead_qualification'],
                        sentiment: 'positive'
                    };
                }
            } catch (error: any) {
                console.error('Managed agent sales reply failed:', error?.message || error);
            }
        }

        // Use Sarvam to generate a personalized qualification response
        if (this.sarvamApiKey) {
            try {
                const salesPrompt = input.specialistPrompt || `You are a professional sales agent. Your goal is to:
1. Understand the customer's needs
2. Present relevant solutions
3. Qualify their interest level
4. Schedule a follow-up if interested

Be conversational, not pushy. Ask discovery questions. Keep responses under 60 words.`;
                const response = await fetch(`${this.sarvamBaseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.sarvamApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'sarvam-m',
                        messages: [
                            {
                                role: 'system',
                                content: salesPrompt
                            },
                            ...input.history.slice(-4),
                            { role: 'user', content: input.message }
                        ],
                        temperature: 0.7,
                        max_tokens: 200
                    })
                });

                if (response.ok) {
                    const data: any = await response.json();
                    return {
                        reply: data.choices?.[0]?.message?.content || 'I\'d love to help you find the right solution. What specific needs are you looking to address?',
                        actions: ['lead_qualification'],
                        sentiment: 'positive'
                    };
                }
            } catch (error: any) {
                console.error('Sales AI error:', error.message);
            }
        }

        return {
            reply: 'Thank you for your interest! I\'d love to understand your needs better. Could you tell me what specific challenges you\'re looking to solve? That way I can recommend the best solution for you.',
            actions: ['lead_qualification'],
            sentiment: 'positive'
        };
    }

    private async handlePricing(input: AgentInput): Promise<AgentOutput> {
        return {
            reply: 'Great question about pricing! Our plans are customized based on your specific needs and usage. I can have our team prepare a personalized quote for you. What\'s the best email to send that to?',
            actions: ['pricing_requested', 'capture_email'],
            sentiment: 'positive'
        };
    }

    private async handleDemoRequest(input: AgentInput): Promise<AgentOutput> {
        return {
            reply: 'Absolutely! I\'d love to set up a demo for you. We can do a quick 15-minute walkthrough of the platform. What day and time works best for you this week?',
            actions: ['demo_requested', 'schedule_followup'],
            sentiment: 'positive'
        };
    }

    private async handleComparison(input: AgentInput): Promise<AgentOutput> {
        return {
            reply: 'That\'s a smart approach to compare options. Our platform stands out with multi-language AI support across 22 Indian languages, real-time voice AI, and automated campaign management. Would you like me to go deeper into any specific feature?',
            actions: ['comparison_requested'],
            sentiment: 'positive'
        };
    }
}
