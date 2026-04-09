/**
 * Plan catalog for Qestron billing.
 *
 * Prices in INR (Indian Rupees). Stripe price IDs should be configured
 * via env vars: STRIPE_STARTER_PRICE_ID, STRIPE_GROWTH_PRICE_ID, STRIPE_PRO_PRICE_ID.
 */

export interface PlanDefinition {
  id: string;
  name: string;
  priceMonthly: number;   // INR
  priceYearly: number;    // INR
  stripePriceId: string;  // Monthly price from env
  stripeYearlyPriceId?: string; // Yearly price from env
  popular: boolean;
  limits: {
    voiceMinutes: number;
    chatMessages: number;
    agents: number;
    campaigns: number;
    knowledgeSources: number;
    contacts: number;
  };
  features: string[];
}

export const PLANS: Record<string, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceId: '',
    popular: false,
    limits: {
      voiceMinutes: 30,
      chatMessages: 500,
      agents: 1,
      campaigns: 1,
      knowledgeSources: 3,
      contacts: 100,
    },
    features: [
      '1 AI Agent',
      '30 voice minutes/mo',
      '500 chat messages/mo',
      '1 campaign',
      '3 knowledge sources',
      'Community support',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 8200,
    priceYearly: 82000,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
    stripeYearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || '',
    popular: false,
    limits: {
      voiceMinutes: 300,
      chatMessages: 5000,
      agents: 3,
      campaigns: 10,
      knowledgeSources: 10,
      contacts: 1000,
    },
    features: [
      '3 AI Agents',
      '300 voice minutes/mo',
      '5,000 chat messages/mo',
      '10 campaigns/mo',
      '10 knowledge sources',
      'Email support',
      'Basic analytics',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    priceMonthly: 24900,
    priceYearly: 249000,
    stripePriceId: process.env.STRIPE_GROWTH_PRICE_ID || process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID || '',
    stripeYearlyPriceId: process.env.STRIPE_GROWTH_YEARLY_PRICE_ID || '',
    popular: true,
    limits: {
      voiceMinutes: 1000,
      chatMessages: 25000,
      agents: 10,
      campaigns: 50,
      knowledgeSources: 50,
      contacts: 10000,
    },
    features: [
      '10 AI Agents',
      '1,000 voice minutes/mo',
      '25,000 chat messages/mo',
      '50 campaigns/mo',
      '50 knowledge sources',
      'Priority support',
      'Advanced analytics',
      'CRM & pipeline',
      'Invoicing',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 49900,
    priceYearly: 499000,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    stripeYearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
    popular: false,
    limits: {
      voiceMinutes: 5000,
      chatMessages: 100000,
      agents: 50,
      campaigns: 200,
      knowledgeSources: 200,
      contacts: 50000,
    },
    features: [
      'Unlimited AI Agents (up to 50)',
      '5,000 voice minutes/mo',
      '100,000 chat messages/mo',
      '200 campaigns/mo',
      '200 knowledge sources',
      'Dedicated support',
      'AI insights & reports',
      'Full CRM & invoicing',
      'Custom integrations',
      'API access',
    ],
  },
};

export function getPlanById(planId: string): PlanDefinition | null {
  return PLANS[planId] || null;
}

export function getAllPlans(): PlanDefinition[] {
  return Object.values(PLANS);
}

export function getPlanStripePriceId(planId: string, interval: 'month' | 'year' = 'month'): string | null {
  const plan = getPlanById(planId);
  if (!plan) {
    return null;
  }

  const priceId = interval === 'year'
    ? plan.stripeYearlyPriceId || ''
    : plan.stripePriceId || '';

  return priceId || null;
}
