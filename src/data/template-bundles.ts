export interface TemplateBundle {
  voiceTemplateIds: string[];
  chatTemplateIds: string[];
  recommendedIntegrations: string[];
}

export const industryBundles: Record<string, TemplateBundle> = {
  dental: {
    voiceTemplateIds: [
      "appointment-booking",
      "faq-responder",
      "lead-intake",
      "emergency-triage",
      "appointment-reminder",
      "follow-up-call",
      "win-back",
      "after-hours-handler",
    ],
    chatTemplateIds: [
      "appointment-booking",
      "faq-responder",
      "lead-intake",
      "appointment-reminder",
    ],
    recommendedIntegrations: [
      "Google Calendar",
      "Epic",
      "HubSpot",
      "SMS",
    ],
  },
  salon: {
    voiceTemplateIds: [
      "appointment-booking",
      "faq-responder",
      "appointment-reminder",
      "follow-up-call",
      "review-request",
      "win-back",
      "birthday-greeting",
    ],
    chatTemplateIds: [
      "appointment-booking",
      "faq-responder",
      "appointment-reminder",
    ],
    recommendedIntegrations: [
      "Google Calendar",
      "Square",
      "HubSpot",
      "SMS",
    ],
  },
  hvac: {
    voiceTemplateIds: [
      "lead-intake",
      "emergency-triage",
      "quote-request",
      "service-dispatch",
      "appointment-reminder",
      "payment-reminder",
      "after-hours-handler",
    ],
    chatTemplateIds: [
      "lead-intake",
      "faq-responder",
      "quote-request",
    ],
    recommendedIntegrations: [
      "ServiceTitan",
      "Jobber",
      "Stripe",
      "Google Calendar",
    ],
  },
  restaurant: {
    voiceTemplateIds: [
      "reservation",
      "order-taking",
      "faq-responder",
      "appointment-reminder",
      "delivery-confirmation",
    ],
    chatTemplateIds: [
      "reservation",
      "order-taking",
      "faq-responder",
      "delivery-confirmation",
    ],
    recommendedIntegrations: ["OpenTable", "Toast", "Stripe", "SMS"],
  },
  realestate: {
    voiceTemplateIds: [
      "lead-intake",
      "quote-request",
      "visitor-management",
      "follow-up-call",
      "win-back",
      "after-hours-handler",
    ],
    chatTemplateIds: [
      "lead-intake",
      "faq-responder",
      "quote-request",
      "visitor-management",
    ],
    recommendedIntegrations: [
      "HubSpot",
      "Salesforce",
      "Google Calendar",
      "Zillow",
    ],
  },
  legal: {
    voiceTemplateIds: [
      "lead-intake",
      "appointment-booking",
      "faq-responder",
      "follow-up-call",
      "after-hours-handler",
    ],
    chatTemplateIds: [
      "lead-intake",
      "appointment-booking",
      "faq-responder",
    ],
    recommendedIntegrations: ["Clio", "HubSpot", "Google Calendar", "SMS"],
  },
  gym: {
    voiceTemplateIds: [
      "appointment-booking",
      "registration",
      "faq-responder",
      "appointment-reminder",
      "win-back",
      "birthday-greeting",
    ],
    chatTemplateIds: [
      "appointment-booking",
      "registration",
      "faq-responder",
    ],
    recommendedIntegrations: ["Mindbody", "Stripe", "HubSpot", "SMS"],
  },
  vet: {
    voiceTemplateIds: [
      "appointment-booking",
      "emergency-triage",
      "faq-responder",
      "lead-intake",
      "appointment-reminder",
      "follow-up-call",
    ],
    chatTemplateIds: [
      "appointment-booking",
      "faq-responder",
      "lead-intake",
    ],
    recommendedIntegrations: ["Google Calendar", "HubSpot", "Sheets", "SMS"],
  },
  autorepair: {
    voiceTemplateIds: [
      "appointment-booking",
      "faq-responder",
      "lead-intake",
      "quote-request",
      "service-dispatch",
      "appointment-reminder",
      "payment-reminder",
    ],
    chatTemplateIds: [
      "appointment-booking",
      "faq-responder",
      "lead-intake",
    ],
    recommendedIntegrations: [
      "Google Calendar",
      "Shopify",
      "Stripe",
      "SMS",
    ],
  },
  insurance: {
    voiceTemplateIds: [
      "lead-intake",
      "quote-request",
      "payment-collection",
      "payment-reminder",
      "recall-notification",
    ],
    chatTemplateIds: [
      "lead-intake",
      "faq-responder",
      "quote-request",
      "payment-collection",
    ],
    recommendedIntegrations: ["Salesforce", "Stripe", "HubSpot", "Email"],
  },
  education: {
    voiceTemplateIds: [
      "appointment-booking",
      "registration",
      "faq-responder",
      "lead-intake",
      "appointment-reminder",
    ],
    chatTemplateIds: [
      "appointment-booking",
      "registration",
      "faq-responder",
    ],
    recommendedIntegrations: ["Google Calendar", "HubSpot", "Moodle", "SMS"],
  },
  logistics: {
    voiceTemplateIds: [
      "service-dispatch",
      "delivery-confirmation",
      "inventory-check",
      "faq-responder",
      "follow-up-call",
    ],
    chatTemplateIds: [
      "faq-responder",
      "inventory-check",
      "delivery-confirmation",
    ],
    recommendedIntegrations: ["Samsara", "Shopify", "Sheets", "SMS"],
  },
};
