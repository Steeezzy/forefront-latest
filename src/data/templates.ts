import { Template } from '../types';

export const TEMPLATES: Template[] = [
  // INBOUND TEMPLATES
  {
    id: 'appt-booking',
    name: 'Appointment Booking',
    category: 'inbound',
    function: 'Schedules business appointments and syncs with calendar.',
    description: 'A specialized agent that handles calendar availability, services, and appointment confirmation.',
    icon: '📅',
    configFields: [
      { key: 'calendarId', label: 'Calendar ID', type: 'text', required: true },
      { key: 'bufferTime', label: 'Buffer Time (mins)', type: 'number', required: false, defaultValue: 15 },
      { key: 'reschedulePolicy', label: 'Reschedule Policy', type: 'textarea', required: true }
    ],
    requiredIntegrations: ['Google Calendar', 'Outlook'],
    industries: ['medical', 'salon', 'law', 'fitness', 'veterinary', 'auto', 'education'],
    setupTime: '5 mins',
    complexity: 'medium'
  },
  {
    id: 'faq-responder',
    name: 'FAQ Responder',
    category: 'inbound',
    function: 'Answers common questions using your knowledge base.',
    description: 'An AI assistant trained on your docs to provide instant, accurate answers 24/7.',
    icon: '❓',
    configFields: [
      { key: 'unclearResponse', label: 'Unclear Response', type: 'textarea', required: true, defaultValue: "I'm not quite sure, let me get a human for you." }
    ],
    requiredIntegrations: [],
    industries: ['medical', 'salon', 'hvac', 'restaurant', 'realestate', 'law', 'fitness', 'veterinary', 'auto', 'insurance', 'education', 'logistics'],
    setupTime: '2 mins',
    complexity: 'simple'
  },
  {
    id: 'lead-intake',
    name: 'Lead Intake',
    category: 'inbound',
    function: 'Captures and qualifies new business leads.',
    description: 'Interrogates new prospects and scores them before sending to your CRM.',
    icon: '🎯',
    configFields: [
      { key: 'crmEndpoint', label: 'CRM Webhook', type: 'text', required: true },
      { key: 'qualifyingQuestions', label: 'Qualifying Questions', type: 'list', required: true }
    ],
    requiredIntegrations: ['HubSpot', 'Salesforce', 'GoHighLevel'],
    industries: ['hvac', 'realestate', 'law', 'insurance'],
    setupTime: '10 mins',
    complexity: 'medium'
  },
  {
    id: 'order-taking',
    name: 'Order Taking',
    category: 'inbound',
    function: 'Processes item orders and reservations.',
    description: 'Handles product selection, quantity, and initial order confirmation.',
    icon: '🛍️',
    configFields: [
      { key: 'inventoryApi', label: 'Inventory API', type: 'text', required: true }
    ],
    requiredIntegrations: ['Shopify', 'WooCommerce'],
    industries: ['restaurant', 'retail', 'logistics'],
    setupTime: '15 mins',
    complexity: 'complex'
  },
  {
    id: 'reservation',
    name: 'Reservation',
    category: 'inbound',
    function: 'Manages table or venue reservations.',
    description: 'Handles party size, time, and special requests for hospitality businesses.',
    icon: '🍷',
    configFields: [
      { key: 'maxPartySize', label: 'Max Party Size', type: 'number', required: true, defaultValue: 8 }
    ],
    requiredIntegrations: ['OpenTable'],
    industries: ['restaurant'],
    setupTime: '5 mins',
    complexity: 'medium'
  },
  {
    id: 'emergency-triage',
    name: 'Emergency Triage',
    category: 'inbound',
    function: 'Identifies and escalates urgent requests.',
    description: 'Uses logic to determine if a request needs immediate human intervention.',
    icon: '🚨',
    configFields: [
      { key: 'emergencyKeywords', label: 'Emergency Keywords', type: 'list', required: true },
      { key: 'escalationPhone', label: 'Escalation Phone', type: 'text', required: true }
    ],
    requiredIntegrations: ['Twilio'],
    industries: ['medical', 'hvac', 'veterinary', 'auto'],
    setupTime: '5 mins',
    complexity: 'medium'
  },
  {
    id: 'quote-request',
    name: 'Quote Request',
    category: 'inbound',
    function: 'Gathers details for custom price quotes.',
    description: 'Collects specific project requirements to generate accurate estimates.',
    icon: '💰',
    configFields: [
      { key: 'quoteFields', label: 'Information to Gather', type: 'list', required: true }
    ],
    requiredIntegrations: ['Jobber', 'HubSpot'],
    industries: ['hvac', 'law', 'insurance', 'auto', 'logistics'],
    setupTime: '10 mins',
    complexity: 'medium'
  },
  {
    id: 'service-dispatch',
    name: 'Service Dispatch',
    category: 'inbound',
    function: 'Coordinates field technician scheduling.',
    description: 'Matches incoming service requests with available technicians in the field.',
    icon: '🚛',
    configFields: [
      { key: 'dispatchArea', label: 'Service Area (Zip)', type: 'text', required: true }
    ],
    requiredIntegrations: ['ServiceTitan', 'Jobber'],
    industries: ['hvac', 'auto', 'logistics'],
    setupTime: '20 mins',
    complexity: 'complex'
  },
  {
    id: 'call-routing',
    name: 'Call Routing',
    category: 'inbound',
    function: 'Smart IVR for directing callers to departments.',
    description: 'Interprets natural language to transfer callers to the right person or team.',
    icon: '📞',
    configFields: [
      { key: 'departments', label: 'Department Mapping', type: 'list', required: true }
    ],
    requiredIntegrations: ['Twilio'],
    industries: ['medical', 'realestate', 'law', 'insurance', 'education', 'logistics'],
    setupTime: '5 mins',
    complexity: 'medium'
  },
  {
    id: 'complaint-handling',
    name: 'Complaint Handling',
    category: 'inbound',
    function: 'Apologizes and logs customer issues.',
    description: 'Empathetically handles frustrations while gathering data for resolution.',
    icon: '😠',
    configFields: [
      { key: 'maxSentiment', label: 'Max Frown Threshold', type: 'number', required: true, defaultValue: 3 }
    ],
    requiredIntegrations: ['Zendesk', 'Salesforce'],
    industries: ['restaurant', 'retail', 'logistics', 'fitness'],
    setupTime: '5 mins',
    complexity: 'medium'
  },
  {
    id: 'info-hotline',
    name: 'Information Hotline',
    category: 'inbound',
    function: 'Provides generic business information.',
    description: 'Gives hours, location, and basic service overview without knowledge base sync.',
    icon: '📢',
    configFields: [
      { key: 'staticInfo', label: 'Static Business Info', type: 'textarea', required: true }
    ],
    requiredIntegrations: [],
    industries: ['medical', 'salon', 'hvac', 'restaurant', 'realestate', 'law', 'fitness', 'veterinary', 'auto', 'insurance', 'education', 'logistics'],
    setupTime: '2 mins',
    complexity: 'simple'
  },
  {
    id: 'registration',
    name: 'Registration',
    category: 'inbound',
    function: 'Sign-ups for events or memberships.',
    description: 'Captures user details for new registrations and account creation.',
    icon: '📝',
    configFields: [
      { key: 'userFields', label: 'Fields to Capture', type: 'list', required: true }
    ],
    requiredIntegrations: ['Stripe', 'HubSpot'],
    industries: ['fitness', 'education', 'medical'],
    setupTime: '10 mins',
    complexity: 'medium'
  },
  {
    id: 'payment-collection',
    name: 'Payment Collection',
    category: 'inbound',
    function: 'Collects credit card details for bills.',
    description: 'Securely processes payments for invoices, deposits, or bills.',
    icon: '💳',
    configFields: [
      { key: 'stripeSecret', label: 'Stripe Secret Key', type: 'text', required: true }
    ],
    requiredIntegrations: ['Stripe'],
    industries: ['medical', 'law', 'hvac', 'salon'],
    setupTime: '15 mins',
    complexity: 'complex'
  },
  {
    id: 'visitor-management',
    name: 'Visitor/Access Management',
    category: 'inbound',
    function: 'Check-in for physical locations.',
    description: 'Automates visitor sign-in and notifies hosts of arrival.',
    icon: '🏢',
    configFields: [
      { key: 'hostNotification', label: 'Host Notification Method', type: 'select', options: ['SMS', 'Email', 'Slack'], required: true }
    ],
    requiredIntegrations: ['Slack'],
    industries: ['realestate', 'law', 'education'],
    setupTime: '10 mins',
    complexity: 'medium'
  },
  {
    id: 'inventory-check',
    name: 'Inventory Check',
    category: 'inbound',
    function: 'Tells customers if items are in stock.',
    description: 'Syncs with your POS or ERP to provide real-time stock availability.',
    icon: '📦',
    configFields: [
      { key: 'erpKey', label: 'ERP Access Key', type: 'text', required: true }
    ],
    requiredIntegrations: ['Shopify', 'WooCommerce', 'ShipStation'],
    industries: ['retail', 'auto', 'logistics'],
    setupTime: '20 mins',
    complexity: 'complex'
  },

  // OUTBOUND TEMPLATES
  {
    id: 'appt-reminder',
    name: 'Appointment Reminder',
    category: 'outbound',
    function: 'Calls to confirm upcoming appointments.',
    description: 'Reduces no-shows by automatically confirming date, time, and prep steps.',
    icon: '🔔',
    configFields: [
      { key: 'reminderWindow', label: 'Hours Before', type: 'number', required: true, defaultValue: 24 }
    ],
    requiredIntegrations: ['Google Calendar', 'Outlook'],
    industries: ['medical', 'salon', 'law', 'fitness', 'veterinary', 'auto', 'education'],
    setupTime: '5 mins',
    complexity: 'simple'
  },
  {
    id: 'follow-up-call',
    name: 'Follow-Up Call',
    category: 'outbound',
    function: 'Checks in after service or inquiry.',
    description: 'Re-engages old leads or checks if a recent service was satisfactory.',
    icon: '🔄',
    configFields: [
      { key: 'followUpDelay', label: 'Days After', type: 'number', required: true, defaultValue: 3 }
    ],
    requiredIntegrations: ['HubSpot', 'Salesforce'],
    industries: ['medical', 'salon', 'hvac', 'realestate', 'law', 'education', 'logistics'],
    setupTime: '5 mins',
    complexity: 'medium'
  },
  {
    id: 'review-request',
    name: 'Review Request',
    category: 'outbound',
    function: 'Asks happy customers for reviews.',
    description: 'Drives Google and Yelp reviews by calling satisfied customers.',
    icon: '⭐',
    configFields: [
      { key: 'reviewUrl', label: 'Google Review Link', type: 'text', required: true }
    ],
    requiredIntegrations: [],
    industries: ['salon', 'hvac', 'restaurant', 'fitness', 'auto'],
    setupTime: '2 mins',
    complexity: 'simple'
  },
  {
    id: 'win-back-campaign',
    name: 'Win-Back Campaign',
    category: 'outbound',
    function: 'Re-engages lapsed customers.',
    description: 'Calls customers who havent booked in X months with a special offer.',
    icon: '🎁',
    configFields: [
      { key: 'offerCode', label: 'Discount Code', type: 'text', required: true }
    ],
    requiredIntegrations: ['HubSpot'],
    industries: ['salon', 'fitness', 'medical', 'retail', 'realestate'],
    setupTime: '5 mins',
    complexity: 'medium'
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    category: 'outbound',
    function: 'Politely reminds about overdue bills.',
    description: 'Handles the awkward conversation of late payments automatically.',
    icon: '💸',
    configFields: [
      { key: 'lateFeeAmount', label: 'Late Fee ($)', type: 'number', required: false }
    ],
    requiredIntegrations: ['Stripe', 'Jobber', 'Clio'],
    industries: ['medical', 'law', 'hvac', 'auto', 'insurance', 'education'],
    setupTime: '5 mins',
    complexity: 'medium'
  },
  {
    id: 'delivery-confirmation',
    name: 'Delivery Confirmation',
    category: 'outbound',
    function: 'Confirms successful package delivery.',
    description: 'Calls or messages the recipient when a package is delivered.',
    icon: '✅',
    configFields: [],
    requiredIntegrations: ['Samsara', 'ShipStation'],
    industries: ['logistics', 'retail'],
    setupTime: '2 mins',
    complexity: 'simple'
  },
  {
    id: 'survey-cx-call',
    name: 'Survey/CX Call',
    category: 'outbound',
    function: 'Collects customer experience feedback.',
    description: 'Automated NPS or CSAT collection via natural conversation.',
    icon: '📊',
    configFields: [
      { key: 'surveyQuestions', label: 'NPS Questions', type: 'list', required: true }
    ],
    requiredIntegrations: [],
    industries: ['medical', 'salon', 'hvac', 'restaurant', 'realestate', 'fitness', 'education', 'logistics'],
    setupTime: '10 mins',
    complexity: 'medium'
  },
  {
    id: 'event-reminder',
    name: 'Event Reminder',
    category: 'outbound',
    function: 'Notifies about upcoming webinars or events.',
    description: 'Boosts attendance for seminars, live classes, or webinars.',
    icon: '🎟️',
    configFields: [
      { key: 'eventDetails', label: 'Location/URL', type: 'text', required: true }
    ],
    requiredIntegrations: ['Google Calendar', 'Canvas'],
    industries: ['fitness', 'education', 'professional'],
    setupTime: '5 mins',
    complexity: 'simple'
  },
  {
    id: 'recall-notification',
    name: 'Recall Notification',
    category: 'outbound',
    function: 'Informs customers about service recalls.',
    description: 'Safety-critical outreach for auto or product recalls.',
    icon: '⚠️',
    configFields: [
      { key: 'recallDetails', label: 'Recall Explanation', type: 'textarea', required: true }
    ],
    requiredIntegrations: ['Shopmonkey', 'Mitchell1'],
    industries: ['auto', 'retail'],
    setupTime: '5 mins',
    complexity: 'medium'
  },
  {
    id: 'birthday-greeting',
    name: 'Birthday/Greeting',
    category: 'outbound',
    function: 'Sends friendly milestone wishes.',
    description: 'Deepens relationships with personal birthday or anniversary greetings.',
    icon: '🎂',
    configFields: [
      { key: 'giftOffer', label: 'Birthday Gift', type: 'text', required: false }
    ],
    requiredIntegrations: ['HubSpot'],
    industries: ['salon', 'fitness', 'medical', 'realestate'],
    setupTime: '2 mins',
    complexity: 'simple'
  },

  // HYBRID TEMPLATES
  {
    id: 'location-router',
    name: 'Multi-Location Router',
    category: 'hybrid',
    function: 'Routes calls/chats based on customer location.',
    description: 'Smart geographic routing for businesses with multiple branches.',
    icon: '📍',
    configFields: [
      { key: 'locations', label: 'Location Postcodes', type: 'list', required: true }
    ],
    requiredIntegrations: ['Twilio'],
    industries: ['medical', 'salon', 'hvac', 'restaurant', 'realestate', 'law', 'fitness', 'veterinary', 'auto', 'insurance', 'education', 'retail'],
    setupTime: '15 mins',
    complexity: 'complex'
  },
  {
    id: 'bilingual-handler',
    name: 'Bilingual Handler',
    category: 'hybrid',
    function: 'Switches language based on caller preference.',
    description: 'Seamlessly detects and toggles between two primary languages.',
    icon: '🗣️',
    configFields: [
      { key: 'secondaryLang', label: 'Secondary Language', type: 'select', options: ['Hindi', 'Spanish', 'Tamil', 'Telugu'], required: true }
    ],
    requiredIntegrations: [],
    industries: ['medical', 'law', 'hvac', 'education', 'logistics'],
    setupTime: '10 mins',
    complexity: 'medium'
  },
  {
    id: 'vip-caller',
    name: 'VIP Caller',
    category: 'hybrid',
    function: 'Provides specialized handling for VIPs.',
    description: 'Prioritizes high-value customers with dedicated AI scripts.',
    icon: '💎',
    configFields: [
      { key: 'vipTags', label: 'VIP CRM Tags', type: 'list', required: true }
    ],
    requiredIntegrations: ['HubSpot', 'Salesforce'],
    industries: ['realestate', 'law', 'insurance', 'fitness', 'salon', 'medical'],
    setupTime: '10 mins',
    complexity: 'medium'
  },
  {
    id: 'after-hours-handler',
    name: 'After-Hours Handler',
    category: 'hybrid',
    function: 'Takes over when the office is closed.',
    description: 'Enforcement of business hours with automated triage during nights/weekends.',
    icon: '🌙',
    configFields: [
      { key: 'officeHours', label: 'Business Hours', type: 'text', required: true }
    ],
    requiredIntegrations: [],
    industries: ['medical', 'hvac', 'law', 'veterinary', 'auto', 'insurance'],
    setupTime: '5 mins',
    complexity: 'medium'
  },
  {
    id: 'overflow-handler',
    name: 'Overflow Handler',
    category: 'hybrid',
    function: 'Assists when human agents are busy.',
    description: 'Takes calls during peak times when the front desk is overwhelmed.',
    icon: '🌊',
    configFields: [
      { key: 'waitThreshold', label: 'Seconds until takeover', type: 'number', required: true, defaultValue: 30 }
    ],
    requiredIntegrations: ['Twilio'],
    industries: ['medical', 'salon', 'hvac', 'restaurant', 'realestate', 'law', 'fitness', 'veterinary', 'auto', 'insurance', 'education', 'logistics', 'retail'],
    setupTime: '10 mins',
    complexity: 'medium'
  }
];
