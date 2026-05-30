export type FeatureStatus = 'implemented' | 'partial' | 'missing' | 'operational';

export interface BillingFeatureDefinition {
    id: string;
    label: string;
    category: 'channel' | 'support' | 'ai' | 'flows' | 'admin' | 'brand' | 'voice' | 'operations';
    status: FeatureStatus;
    summary: string;
    evidence?: string;
}

export interface MeterDefinition {
    id: string;
    label: string;
    unit: string;
    summary: string;
}

export interface PlanTemplate {
    id: string;
    family: 'customer-service' | 'conversa-ai' | 'flows';
    name: string;
    monthlyPrice: number;
    currency: 'USD';
    billingMode: 'free' | 'self_serve' | 'contact_sales';
    summary: string;
    meterDefaults: Record<string, number | null>;
    featureIds: string[];
}

export interface VoiceAddonTemplate {
    id: string;
    name: string;
    monthlyPrice: number;
    currency: 'USD';
    billingMode: 'included' | 'self_serve' | 'contact_sales';
    summary: string;
    meterDefaults: Record<string, number | null>;
    featureIds: string[];
}

export const FEATURE_REGISTRY: BillingFeatureDefinition[] = [
    {
        id: 'live_chat',
        label: 'Live Chat',
        category: 'channel',
        status: 'implemented',
        summary: 'Web chat widget, inbox, and chat page are present.',
        evidence: 'widget, inbox, and chat routes are implemented.',
    },
    {
        id: 'helpdesk_system',
        label: 'Helpdesk system',
        category: 'support',
        status: 'implemented',
        summary: 'Tickets, inbox, and assignment flows exist.',
        evidence: 'ticket and inbox modules are live.',
    },
    {
        id: 'email_management',
        label: 'Email management system',
        category: 'channel',
        status: 'implemented',
        summary: 'Inbound email processing and channel settings exist.',
        evidence: 'EmailChannelService and channel routes.',
    },
    {
        id: 'live_video_calls',
        label: 'Live Video calls',
        category: 'channel',
        status: 'missing',
        summary: 'No video calling transport or meeting UI exists.',
    },
    {
        id: 'messenger_integration',
        label: 'Messenger integration',
        category: 'channel',
        status: 'implemented',
        summary: 'Meta OAuth, webhook intake, and outbound routing exist.',
        evidence: 'MessengerService and social routes.',
    },
    {
        id: 'instagram_integration',
        label: 'Instagram integration',
        category: 'channel',
        status: 'implemented',
        summary: 'Instagram account connection and messaging routes exist.',
        evidence: 'InstagramService and social routes.',
    },
    {
        id: 'whatsapp_integration',
        label: 'WhatsApp integration',
        category: 'channel',
        status: 'implemented',
        summary: 'WhatsApp webhook intake and outbound messaging exist.',
        evidence: 'WhatsAppService and social routes.',
    },
    {
        id: 'email_integration',
        label: 'Email integration',
        category: 'channel',
        status: 'implemented',
        summary: 'Email channel settings and inbox support are wired.',
        evidence: 'EmailChannelService and settings/email page.',
    },
    {
        id: 'app_integrations',
        label: 'App integrations',
        category: 'admin',
        status: 'implemented',
        summary: 'CRM, marketing, analytics, e-commerce, and support integrations exist.',
        evidence: 'integration.routes.ts and provider modules.',
    },
    {
        id: 'widget_customization',
        label: 'Widget customization',
        category: 'brand',
        status: 'implemented',
        summary: 'Widget style, placement, and branding settings exist.',
        evidence: 'widget config schema and builder routes.',
    },
    {
        id: 'custom_sending_domain',
        label: 'Custom sending domain',
        category: 'brand',
        status: 'partial',
        summary: 'Domain verification and DNS setup exist, but full billing-aware white-label mail management is not complete.',
        evidence: 'domain routes and custom domain modal.',
    },
    {
        id: 'custom_email_signature',
        label: 'Custom email signature',
        category: 'brand',
        status: 'missing',
        summary: 'No dedicated email-signature composer or outbound signature injection exists.',
    },
    {
        id: 'analytics',
        label: 'Analytics',
        category: 'admin',
        status: 'implemented',
        summary: 'Workspace analytics, widget events, and call analytics tables/routes exist.',
        evidence: 'analytics routes and analytics migrations.',
    },
    {
        id: 'ai_reply_assistant',
        label: 'Tidio AI reply assistant',
        category: 'ai',
        status: 'implemented',
        summary: 'Conversa/chat auto-reply, RAG, and agent configuration are present.',
        evidence: 'chatbot pages, RAG services, and auto-reply engine.',
    },
    {
        id: 'support_over_email',
        label: 'Support over email',
        category: 'operations',
        status: 'operational',
        summary: 'This is a team/service promise, not a code entitlement.',
    },
    {
        id: 'desktop_app',
        label: 'Desktop app',
        category: 'operations',
        status: 'missing',
        summary: 'No desktop client packaging exists in the repo.',
    },
    {
        id: 'mobile_app',
        label: 'Mobile app',
        category: 'operations',
        status: 'missing',
        summary: 'No mobile app client exists in the repo.',
    },
    {
        id: 'multilanguage',
        label: 'Multilanguage',
        category: 'ai',
        status: 'implemented',
        summary: 'Language configuration exists for chat and voice assistants.',
        evidence: 'LanguagesSettings and voice template language config.',
    },
    {
        id: 'live_visitors_list',
        label: 'Live visitors list',
        category: 'support',
        status: 'partial',
        summary: 'Visitor/page-view tracking exists, but a polished dedicated live-visitor console is incomplete.',
        evidence: 'visitor tracking and page_views storage exist.',
    },
    {
        id: 'operating_hours',
        label: 'Operating hours',
        category: 'support',
        status: 'implemented',
        summary: 'Workspace hours and channel auto-reply restrictions are supported.',
        evidence: 'workspace settings and settings/operating-hours.',
    },
    {
        id: 'chat_page',
        label: 'Chat page',
        category: 'channel',
        status: 'implemented',
        summary: 'Branded chat page/domain flows exist.',
        evidence: 'domain modal and widget/chat page support.',
    },
    {
        id: 'no_branding',
        label: 'No branding',
        category: 'brand',
        status: 'partial',
        summary: 'Branding controls exist, but a complete white-label removal policy is not centrally enforced.',
        evidence: 'widget config has branding flags, but plan gating is not wired.',
    },
    {
        id: 'live_typing',
        label: 'Live typing',
        category: 'channel',
        status: 'partial',
        summary: 'Typing indicators exist in sockets and some channel integrations, but not consistently across all channels.',
        evidence: 'enhanced socket server and Messenger sender actions.',
    },
    {
        id: 'viewed_pages_history',
        label: 'Viewed Pages history',
        category: 'support',
        status: 'partial',
        summary: 'Page views are tracked, but the UI exposure is limited.',
        evidence: 'visitor service stores page_views.',
    },
    {
        id: 'visitors_info',
        label: 'Visitors info',
        category: 'support',
        status: 'implemented',
        summary: 'Visitor info is shown inside the inbox side panel.',
        evidence: 'VisitorInfoPanel.tsx.',
    },
    {
        id: 'visitor_notes',
        label: 'Visitor notes',
        category: 'support',
        status: 'implemented',
        summary: 'Agents can add note-type messages to visitor threads.',
        evidence: 'VisitorInfoPanel note composer and inbox note support.',
    },
    {
        id: 'automatic_response',
        label: 'Automatic response',
        category: 'ai',
        status: 'implemented',
        summary: 'Auto-reply engine exists across chat, email, and social channels.',
        evidence: 'AutoReplyEngine and channel/social routes.',
    },
    {
        id: 'automatic_chat_assignment',
        label: 'Automatic chat assignment',
        category: 'support',
        status: 'partial',
        summary: 'Round-robin assignment logic exists, but there is no polished entitlement-aware admin flow.',
        evidence: 'WorkflowEngine round-robin actions.',
    },
    {
        id: 'automated_satisfaction_survey',
        label: 'Automated satisfaction survey',
        category: 'support',
        status: 'partial',
        summary: 'CSAT fields and survey hooks exist, but the end-user survey workflow is incomplete.',
        evidence: 'analytics CSAT fields and flow survey toggles.',
    },
    {
        id: 'automated_conversation_solving',
        label: 'Automated conversation solving',
        category: 'support',
        status: 'partial',
        summary: 'Workflow automation can auto-close/resolve, but product polish is incomplete.',
        evidence: 'workflow engine supports auto-close style flows.',
    },
    {
        id: 'macros',
        label: 'Macros',
        category: 'support',
        status: 'implemented',
        summary: 'Canned responses/macros page exists.',
        evidence: 'settings/macros page and canned response migration.',
    },
    {
        id: 'permissions',
        label: 'Permissions',
        category: 'admin',
        status: 'implemented',
        summary: 'Workspace member permissions and team roles exist.',
        evidence: 'team routes and team service.',
    },
    {
        id: 'native_shopify_actions',
        label: 'Native Shopify actions',
        category: 'admin',
        status: 'implemented',
        summary: 'Shopify tools support order, customer, cart, and coupon actions.',
        evidence: 'Shopify tools/service and integration UI.',
    },
    {
        id: 'openapi',
        label: 'OpenAPI',
        category: 'admin',
        status: 'partial',
        summary: 'There are many API routes, but no maintained OpenAPI schema/catalog exposed to users.',
    },
    {
        id: 'support_over_live_chat',
        label: 'Support over live chat',
        category: 'operations',
        status: 'operational',
        summary: 'This is a human support promise, not a product entitlement.',
    },
    {
        id: 'departments',
        label: 'Departments',
        category: 'support',
        status: 'partial',
        summary: 'Flow nodes mention department routing, but a full department management system is not complete.',
        evidence: 'flow builder department nodes exist.',
    },
    {
        id: 'multisite',
        label: 'Multisite',
        category: 'brand',
        status: 'partial',
        summary: 'Multiple domains can be configured, but site-aware workspace segmentation is incomplete.',
        evidence: 'domain configuration supports multiple records.',
    },
    {
        id: 'custom_branding',
        label: 'Custom branding',
        category: 'brand',
        status: 'partial',
        summary: 'Branding controls exist, but end-to-end white-label coverage is incomplete.',
        evidence: 'widget/domain branding exists.',
    },
    {
        id: 'strategy_assistance',
        label: 'Flow building and strategy assistance',
        category: 'operations',
        status: 'operational',
        summary: 'This is a service promise, not a software feature.',
    },
    {
        id: 'customer_success_manager',
        label: 'Dedicated Customer Success Manager',
        category: 'operations',
        status: 'operational',
        summary: 'This is an account-service promise, not a code-backed feature.',
    },
    {
        id: 'training_sessions',
        label: 'Training sessions',
        category: 'operations',
        status: 'operational',
        summary: 'This is a service promise, not a software entitlement.',
    },
    {
        id: 'account_reviews',
        label: 'Account reviews',
        category: 'operations',
        status: 'operational',
        summary: 'This is a service promise, not a code-backed feature.',
    },
    {
        id: 'faq_upload',
        label: 'FAQ upload',
        category: 'ai',
        status: 'implemented',
        summary: 'Knowledge upload flows exist.',
        evidence: 'KnowledgeSection and knowledge routes.',
    },
    {
        id: 'faq_scraper',
        label: 'FAQ scraper',
        category: 'ai',
        status: 'implemented',
        summary: 'Website/FAQ scraping flows exist.',
        evidence: 'Website import and knowledge ingestion.',
    },
    {
        id: 'website_scraper',
        label: 'Website scraper',
        category: 'ai',
        status: 'implemented',
        summary: 'Website import and scraping tools exist.',
        evidence: 'WebsiteImportModal and ingestion services.',
    },
    {
        id: 'ai_agent_tasks',
        label: 'Conversa AI Agent tasks',
        category: 'ai',
        status: 'implemented',
        summary: 'Chat actions, sequences, workflows, and automations exist.',
        evidence: 'chatbot actions pages and workflow modules.',
    },
    {
        id: 'personality_customization',
        label: 'Personality customization',
        category: 'ai',
        status: 'implemented',
        summary: 'Agent personality/system prompt settings exist.',
        evidence: 'chat agent personality settings and prompts.',
    },
    {
        id: 'product_recommendation',
        label: 'Conversa product recommendation',
        category: 'ai',
        status: 'partial',
        summary: 'Shopify context and recommendation hooks exist, but the packaged product-recommendation workflow is incomplete.',
        evidence: 'Shopify context panels and recommendation references.',
    },
    {
        id: 'conversa_connect',
        label: 'Conversa Connect',
        category: 'ai',
        status: 'missing',
        summary: 'No dedicated Conversa Connect product/module exists in the repo.',
    },
    {
        id: 'basic_analytics',
        label: 'Basic analytics',
        category: 'admin',
        status: 'implemented',
        summary: 'Analytics dashboards and event tracking exist.',
        evidence: 'analytics page and analytics routes.',
    },
    {
        id: 'sales_flows_templates',
        label: 'Sales Flows templates',
        category: 'flows',
        status: 'implemented',
        summary: 'Sales flow templates and builder screens exist.',
        evidence: 'flows sales pages and flow templates.',
    },
    {
        id: 'faq_flows_templates',
        label: 'FAQ Flows templates',
        category: 'flows',
        status: 'implemented',
        summary: 'FAQ flow templates exist.',
        evidence: 'flow templates include FAQ flows.',
    },
    {
        id: 'visual_flow_builder',
        label: 'Visual Flow builder',
        category: 'flows',
        status: 'implemented',
        summary: 'Visual builder canvas and node editors exist.',
        evidence: 'flows builder components.',
    },
    {
        id: 'voice_agents',
        label: 'Voice agents',
        category: 'voice',
        status: 'implemented',
        summary: 'Voice agent templates, builder, and runtime routes exist.',
        evidence: 'voice agent pages and voice routes.',
    },
    {
        id: 'voice_campaigns',
        label: 'Voice campaigns',
        category: 'voice',
        status: 'implemented',
        summary: 'Campaign creation, CSV imports, and launch flows exist.',
        evidence: 'campaigns page and campaigns routes.',
    },
    {
        id: 'voice_bookings',
        label: 'Voice bookings',
        category: 'voice',
        status: 'implemented',
        summary: 'Bookings and slot provisioning exist.',
        evidence: 'bookings routes and booking provision service.',
    },
    {
        id: 'voice_automation',
        label: 'Voice automation',
        category: 'voice',
        status: 'implemented',
        summary: 'Automation rules/logs are wired for orchestrated sessions.',
        evidence: 'automation routes and workspace UI.',
    },
    {
        id: 'phone_numbers',
        label: 'Phone numbers',
        category: 'voice',
        status: 'implemented',
        summary: 'Provisioning/assignment flows exist for numbers.',
        evidence: 'numbers routes and numbers page.',
    },
    {
        id: 'inbound_calling',
        label: 'Inbound calling',
        category: 'voice',
        status: 'partial',
        summary: 'Inbound toggles and webhook flows exist, but packaging and enforcement are still evolving.',
        evidence: 'orchestrator voice route and templates.',
    },
];

export const METER_REGISTRY: MeterDefinition[] = [
    { id: 'chat_messages', label: 'Chat messages', unit: 'messages / month', summary: 'Usage meter for chat and inbox AI responses.' },
    { id: 'flow_visitors', label: 'Flow visitors', unit: 'visitors / month', summary: 'Reach/visitor allowance for flows.' },
    { id: 'voice_minutes', label: 'Voice minutes', unit: 'minutes / month', summary: 'Voice session duration allowance.' },
    { id: 'voice_agents', label: 'Voice agents', unit: 'agents', summary: 'How many voice agents the workspace can actively run.' },
    { id: 'phone_numbers', label: 'Phone numbers', unit: 'numbers', summary: 'Assigned inbound/outbound phone numbers.' },
    { id: 'knowledge_items', label: 'Knowledge items', unit: 'items', summary: 'Uploaded knowledge sources across chat and voice.' },
    { id: 'automation_rules', label: 'Automation rules', unit: 'rules', summary: 'Workspace automation rules and triggers.' },
    { id: 'team_members', label: 'Team members', unit: 'members', summary: 'Workspace users and seats.' },
];

export const PLAN_TEMPLATES: PlanTemplate[] = [
    {
        id: 'cs-free',
        family: 'customer-service',
        name: 'Free',
        monthlyPrice: 0,
        currency: 'USD',
        billingMode: 'free',
        summary: 'Baseline inbox and chat support.',
        meterDefaults: { chat_messages: 50, team_members: null, knowledge_items: 25, automation_rules: 5 },
        featureIds: [
            'live_chat', 'helpdesk_system', 'email_management', 'messenger_integration', 'instagram_integration',
            'whatsapp_integration', 'email_integration', 'app_integrations', 'widget_customization', 'custom_sending_domain',
            'analytics', 'ai_reply_assistant', 'multilanguage'
        ],
    },
    {
        id: 'cs-starter',
        family: 'customer-service',
        name: 'Starter',
        monthlyPrice: 29,
        currency: 'USD',
        billingMode: 'self_serve',
        summary: 'Small-team customer support plan.',
        meterDefaults: { chat_messages: 100, team_members: null, knowledge_items: 100, automation_rules: 10 },
        featureIds: [
            'live_chat', 'helpdesk_system', 'email_management', 'messenger_integration', 'instagram_integration',
            'whatsapp_integration', 'email_integration', 'app_integrations', 'widget_customization', 'custom_sending_domain',
            'analytics', 'ai_reply_assistant', 'multilanguage', 'live_visitors_list', 'operating_hours', 'chat_page'
        ],
    },
    {
        id: 'cs-growth',
        family: 'customer-service',
        name: 'Growth',
        monthlyPrice: 59,
        currency: 'USD',
        billingMode: 'self_serve',
        summary: 'Higher-volume support with more automation.',
        meterDefaults: { chat_messages: 2000, team_members: null, knowledge_items: 500, automation_rules: 25 },
        featureIds: [
            'live_chat', 'helpdesk_system', 'email_management', 'messenger_integration', 'instagram_integration',
            'whatsapp_integration', 'email_integration', 'app_integrations', 'widget_customization', 'custom_sending_domain',
            'analytics', 'ai_reply_assistant', 'multilanguage', 'live_visitors_list', 'operating_hours', 'chat_page',
            'no_branding', 'live_typing', 'viewed_pages_history', 'visitors_info', 'visitor_notes',
            'automatic_response', 'automatic_chat_assignment', 'automated_satisfaction_survey', 'automated_conversation_solving'
        ],
    },
    {
        id: 'cs-plus',
        family: 'customer-service',
        name: 'Plus',
        monthlyPrice: 749,
        currency: 'USD',
        billingMode: 'contact_sales',
        summary: 'Enterprise service desk package.',
        meterDefaults: { chat_messages: null, team_members: null, knowledge_items: null, automation_rules: null },
        featureIds: [
            'live_chat', 'helpdesk_system', 'email_management', 'messenger_integration', 'instagram_integration',
            'whatsapp_integration', 'email_integration', 'app_integrations', 'widget_customization', 'custom_sending_domain',
            'analytics', 'ai_reply_assistant', 'multilanguage', 'live_visitors_list', 'operating_hours', 'chat_page',
            'no_branding', 'live_typing', 'viewed_pages_history', 'visitors_info', 'visitor_notes',
            'automatic_response', 'automatic_chat_assignment', 'automated_satisfaction_survey', 'automated_conversation_solving',
            'macros', 'permissions', 'native_shopify_actions', 'openapi', 'support_over_live_chat',
            'departments', 'multisite', 'custom_branding', 'strategy_assistance', 'customer_success_manager',
            'training_sessions', 'account_reviews'
        ],
    },
    {
        id: 'conversa-free',
        family: 'conversa-ai',
        name: 'Free',
        monthlyPrice: 0,
        currency: 'USD',
        billingMode: 'free',
        summary: 'Starter AI chat agent plan.',
        meterDefaults: { chat_messages: 50, knowledge_items: 50, automation_rules: 5, team_members: null },
        featureIds: [
            'live_chat', 'faq_upload', 'faq_scraper', 'website_scraper', 'ai_agent_tasks',
            'widget_customization', 'personality_customization', 'multilanguage', 'support_over_email'
        ],
    },
    {
        id: 'conversa-agent',
        family: 'conversa-ai',
        name: 'Conversa AI Agent',
        monthlyPrice: 39,
        currency: 'USD',
        billingMode: 'self_serve',
        summary: 'Primary self-serve AI support plan.',
        meterDefaults: { chat_messages: 1000, knowledge_items: 500, automation_rules: 25, team_members: null },
        featureIds: [
            'live_chat', 'faq_upload', 'faq_scraper', 'website_scraper', 'ai_agent_tasks',
            'widget_customization', 'personality_customization', 'multilanguage', 'support_over_email',
            'no_branding', 'product_recommendation'
        ],
    },
    {
        id: 'conversa-plus',
        family: 'conversa-ai',
        name: 'Plus',
        monthlyPrice: 749,
        currency: 'USD',
        billingMode: 'contact_sales',
        summary: 'Enterprise AI copilot package.',
        meterDefaults: { chat_messages: null, knowledge_items: null, automation_rules: null, team_members: null },
        featureIds: [
            'live_chat', 'faq_upload', 'faq_scraper', 'website_scraper', 'ai_agent_tasks',
            'widget_customization', 'personality_customization', 'multilanguage', 'support_over_email',
            'no_branding', 'product_recommendation', 'support_over_live_chat', 'openapi',
            'conversa_connect', 'custom_branding', 'strategy_assistance', 'customer_success_manager',
            'training_sessions', 'account_reviews'
        ],
    },
    {
        id: 'flows-free',
        family: 'flows',
        name: 'Free',
        monthlyPrice: 0,
        currency: 'USD',
        billingMode: 'free',
        summary: 'Starter automations and visitor flows.',
        meterDefaults: { flow_visitors: 100, automation_rules: 5, team_members: null },
        featureIds: [
            'messenger_integration', 'instagram_integration', 'whatsapp_integration', 'app_integrations',
            'widget_customization', 'basic_analytics', 'sales_flows_templates', 'faq_flows_templates',
            'visual_flow_builder', 'multilanguage'
        ],
    },
    {
        id: 'flows-paid',
        family: 'flows',
        name: 'Flows',
        monthlyPrice: 29,
        currency: 'USD',
        billingMode: 'self_serve',
        summary: 'Higher-volume flows and automation.',
        meterDefaults: { flow_visitors: 100000, automation_rules: 25, team_members: null },
        featureIds: [
            'messenger_integration', 'instagram_integration', 'whatsapp_integration', 'app_integrations',
            'widget_customization', 'basic_analytics', 'sales_flows_templates', 'faq_flows_templates',
            'visual_flow_builder', 'multilanguage', 'no_branding'
        ],
    },
    {
        id: 'flows-plus',
        family: 'flows',
        name: 'Plus',
        monthlyPrice: 749,
        currency: 'USD',
        billingMode: 'contact_sales',
        summary: 'Enterprise workflow package.',
        meterDefaults: { flow_visitors: null, automation_rules: null, team_members: null },
        featureIds: [
            'messenger_integration', 'instagram_integration', 'whatsapp_integration', 'app_integrations',
            'widget_customization', 'basic_analytics', 'sales_flows_templates', 'faq_flows_templates',
            'visual_flow_builder', 'multilanguage', 'no_branding', 'openapi', 'support_over_live_chat',
            'multisite', 'custom_branding', 'strategy_assistance', 'customer_success_manager',
            'training_sessions', 'account_reviews'
        ],
    },
];

export const VOICE_ADDON_TEMPLATES: VoiceAddonTemplate[] = [
    {
        id: 'voice-none',
        name: 'No Voice Add-on',
        monthlyPrice: 0,
        currency: 'USD',
        billingMode: 'included',
        summary: 'Chat-only workspace with no bundled voice capacity.',
        meterDefaults: { voice_minutes: 0, voice_agents: 0, phone_numbers: 0 },
        featureIds: [],
    },
    {
        id: 'voice-starter',
        name: 'Voice Starter',
        monthlyPrice: 49,
        currency: 'USD',
        billingMode: 'self_serve',
        summary: 'Single voice agent with starter calling capacity.',
        meterDefaults: { voice_minutes: 300, voice_agents: 1, phone_numbers: 1 },
        featureIds: ['voice_agents', 'voice_bookings', 'voice_automation', 'phone_numbers'],
    },
    {
        id: 'voice-growth',
        name: 'Voice Growth',
        monthlyPrice: 149,
        currency: 'USD',
        billingMode: 'self_serve',
        summary: 'Multi-agent voice workspace with campaigns and automation.',
        meterDefaults: { voice_minutes: 2000, voice_agents: 3, phone_numbers: 3 },
        featureIds: ['voice_agents', 'voice_bookings', 'voice_automation', 'phone_numbers', 'voice_campaigns', 'inbound_calling'],
    },
    {
        id: 'voice-scale',
        name: 'Voice Scale',
        monthlyPrice: 499,
        currency: 'USD',
        billingMode: 'contact_sales',
        summary: 'Enterprise voice deployment with custom usage.',
        meterDefaults: { voice_minutes: null, voice_agents: null, phone_numbers: null },
        featureIds: ['voice_agents', 'voice_bookings', 'voice_automation', 'phone_numbers', 'voice_campaigns', 'inbound_calling'],
    },
];

export const BILLING_MODEL_RECOMMENDATION = {
    recommendedModel: 'hybrid_subscription_plus_usage_credits',
    summary: 'Use base subscriptions for product access, add a synced voice add-on, and sell credits only for overages or custom enterprise packs.',
    whyNotPureTokens: [
        'Voice minutes, chat messages, and workflow visitors do not have the same cost profile.',
        'A pure token wallet is harder for customers to understand and harder for sales/support to quote.',
        'Subscriptions plus top-up credits keep pricing stable while still allowing custom enterprise deals.',
    ],
    recommendedMeters: ['chat_messages', 'voice_minutes', 'flow_visitors', 'voice_agents', 'phone_numbers'],
};

export function getFeatureDefinition(featureId: string) {
    return FEATURE_REGISTRY.find((feature) => feature.id === featureId);
}

export function getPlanTemplate(planId: string) {
    return PLAN_TEMPLATES.find((plan) => plan.id === normalizeLegacyPlanId(planId)) || PLAN_TEMPLATES.find((plan) => plan.id === 'conversa-free')!;
}

export function getVoiceAddonTemplate(addonId?: string | null) {
    return VOICE_ADDON_TEMPLATES.find((addon) => addon.id === (addonId || 'voice-none')) || VOICE_ADDON_TEMPLATES[0];
}

export function normalizeLegacyPlanId(planId?: string | null) {
    if (!planId || planId === 'free') return 'conversa-free';
    if (planId === 'pro') return 'conversa-agent';
    if (planId === 'business') return 'conversa-plus';
    return planId;
}

export function combineMeterDefaults(
    baseMeters: Record<string, number | null>,
    voiceMeters: Record<string, number | null>,
    overrides?: Record<string, number | null>
) {
    const merged: Record<string, number | null> = {};
    const meterIds = new Set([
        ...Object.keys(baseMeters || {}),
        ...Object.keys(voiceMeters || {}),
        ...Object.keys(overrides || {}),
    ]);

    for (const meterId of meterIds) {
        const overrideValue = overrides?.[meterId];
        if (overrideValue !== undefined) {
            merged[meterId] = overrideValue;
            continue;
        }

        const baseValue = baseMeters?.[meterId];
        const voiceValue = voiceMeters?.[meterId];

        if (baseValue === null || voiceValue === null) {
            merged[meterId] = null;
            continue;
        }

        if (typeof baseValue === 'number' && typeof voiceValue === 'number') {
            merged[meterId] = baseValue + voiceValue;
            continue;
        }

        if (typeof baseValue === 'number') {
            merged[meterId] = baseValue;
            continue;
        }

        if (typeof voiceValue === 'number') {
            merged[meterId] = voiceValue;
            continue;
        }

        merged[meterId] = null;
    }

    return merged;
}

export function combineFeatures(
    baseFeatureIds: string[],
    voiceFeatureIds: string[],
    overrides?: Record<string, boolean>
) {
    const included = new Set<string>([...baseFeatureIds, ...voiceFeatureIds]);
    const resolved: Array<BillingFeatureDefinition & { enabled: boolean }> = [];

    for (const feature of FEATURE_REGISTRY) {
        const override = overrides?.[feature.id];
        const enabled = override !== undefined ? override : included.has(feature.id);
        resolved.push({ ...feature, enabled });
    }

    return resolved;
}
