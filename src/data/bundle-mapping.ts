export const BUNDLE_MAPPING: Record<string, { voiceTemplateIds: string[], chatTemplateIds: string[] }> = {
  medical: {
    voiceTemplateIds: ['appt-booking', 'faq-responder', 'lead-intake', 'emergency-triage', 'appt-reminder', 'follow-up-call', 'win-back-campaign', 'after-hours-handler'],
    chatTemplateIds: ['appt-booking', 'faq-responder', 'lead-intake', 'emergency-triage', 'appt-reminder', 'follow-up-call', 'win-back-campaign', 'after-hours-handler']
  },
  salon: {
    voiceTemplateIds: ['appt-booking', 'faq-responder', 'appt-reminder', 'follow-up-call', 'review-request', 'win-back-campaign', 'birthday-greeting'],
    chatTemplateIds: ['appt-booking', 'faq-responder', 'appt-reminder', 'follow-up-call', 'review-request', 'win-back-campaign', 'birthday-greeting']
  },
  hvac: {
    voiceTemplateIds: ['lead-intake', 'emergency-triage', 'quote-request', 'service-dispatch', 'appt-reminder', 'payment-reminder', 'after-hours-handler'],
    chatTemplateIds: ['lead-intake', 'emergency-triage', 'quote-request', 'service-dispatch', 'appt-reminder', 'payment-reminder', 'after-hours-handler']
  },
  restaurant: {
    voiceTemplateIds: ['reservation', 'order-taking', 'faq-responder', 'appt-reminder', 'delivery-confirmation'],
    chatTemplateIds: ['reservation', 'order-taking', 'faq-responder', 'appt-reminder', 'delivery-confirmation']
  },
  realestate: {
    voiceTemplateIds: ['lead-intake', 'quote-request', 'visitor-management', 'follow-up-call', 'win-back-campaign', 'after-hours-handler'],
    chatTemplateIds: ['lead-intake', 'quote-request', 'visitor-management', 'follow-up-call', 'win-back-campaign', 'after-hours-handler']
  },
  law: {
    voiceTemplateIds: ['lead-intake', 'appt-booking', 'faq-responder', 'follow-up-call', 'after-hours-handler'],
    chatTemplateIds: ['lead-intake', 'appt-booking', 'faq-responder', 'follow-up-call', 'after-hours-handler']
  },
  fitness: {
    voiceTemplateIds: ['appt-booking', 'registration', 'faq-responder', 'appt-reminder', 'win-back-campaign', 'birthday-greeting'],
    chatTemplateIds: ['appt-booking', 'registration', 'faq-responder', 'appt-reminder', 'win-back-campaign', 'birthday-greeting']
  },
  veterinary: {
    voiceTemplateIds: ['appt-booking', 'emergency-triage', 'faq-responder', 'lead-intake', 'appt-reminder', 'follow-up-call'],
    chatTemplateIds: ['appt-booking', 'emergency-triage', 'faq-responder', 'lead-intake', 'appt-reminder', 'follow-up-call']
  },
  auto: {
    voiceTemplateIds: ['appt-booking', 'faq-responder', 'lead-intake', 'quote-request', 'service-dispatch', 'appt-reminder', 'payment-reminder'],
    chatTemplateIds: ['appt-booking', 'faq-responder', 'lead-intake', 'quote-request', 'service-dispatch', 'appt-reminder', 'payment-reminder']
  },
  insurance: {
    voiceTemplateIds: ['lead-intake', 'quote-request', 'payment-collection', 'payment-reminder', 'recall-notification'],
    chatTemplateIds: ['lead-intake', 'quote-request', 'payment-collection', 'payment-reminder', 'recall-notification']
  },
  education: {
    voiceTemplateIds: ['appt-booking', 'registration', 'faq-responder', 'lead-intake', 'appt-reminder'],
    chatTemplateIds: ['appt-booking', 'registration', 'faq-responder', 'lead-intake', 'appt-reminder']
  },
  logistics: {
    voiceTemplateIds: ['service-dispatch', 'delivery-confirmation', 'inventory-check', 'faq-responder', 'follow-up-call'],
    chatTemplateIds: ['service-dispatch', 'delivery-confirmation', 'inventory-check', 'faq-responder', 'follow-up-call']
  }
};
