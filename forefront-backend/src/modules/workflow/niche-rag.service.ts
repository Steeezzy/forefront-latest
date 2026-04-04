type WorkflowCategory = 'ai' | 'sales' | 'it-ops' | 'marketing' | 'document-ops' | 'support' | 'other';

type TriggerMode = 'schedule' | 'event' | 'manual' | 'inbox' | 'polling' | 'chat';

interface N8nTemplateKnowledgeItem {
    id: string;
    title: string;
    url: string;
    category: WorkflowCategory;
    subcategory: string;
    summary: string;
    businessProblems: string[];
    industries: string[];
    keywords: string[];
    requiredApps: string[];
    triggerMode: TriggerMode;
    requiresWebhook: boolean;
    freeTemplate: boolean;
}

interface IndustryProfile {
    id: string;
    name: string;
    aliases: string[];
    defaultCategories: WorkflowCategory[];
    servicePackages: string[];
    priorityKeywords: string[];
}

export interface NicheRagRecommendationRequest {
    industryId?: string;
    industryName?: string;
    problemStatement: string;
    goals?: string[];
    painPoints?: string[];
    categories?: WorkflowCategory[];
    avoidWebhooks?: boolean;
    maxTemplates?: number;
}

interface RankedTemplate extends N8nTemplateKnowledgeItem {
    score: number;
    matchedKeywords: string[];
    matchedProblems: string[];
}

const CATEGORY_OPTIONS: Array<{ id: WorkflowCategory; label: string }> = [
    { id: 'ai', label: 'AI' },
    { id: 'sales', label: 'Sales' },
    { id: 'it-ops', label: 'IT Ops' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'document-ops', label: 'Document Ops' },
    { id: 'support', label: 'Support' },
    { id: 'other', label: 'Other' },
];

const INDUSTRY_PROFILES: IndustryProfile[] = [
    {
        id: 'dental',
        name: 'Dental and Medical Clinics',
        aliases: ['clinic', 'dental', 'hospital', 'medical', 'healthcare'],
        defaultCategories: ['support', 'document-ops', 'marketing', 'ai'],
        servicePackages: ['Appointment booking', 'Patient reminders', 'Prescription and FAQ assistant', 'Invoice and insurance document intake'],
        priorityKeywords: ['appointment', 'triage', 'patient', 'insurance', 'follow-up'],
    },
    {
        id: 'salon',
        name: 'Salons and Spas',
        aliases: ['salon', 'spa', 'beauty'],
        defaultCategories: ['marketing', 'sales', 'support', 'ai'],
        servicePackages: ['Booking funnel', 'No-show recovery', 'Review automation', 'Loyalty and win-back journeys'],
        priorityKeywords: ['booking', 'review', 'promotion', 'reschedule', 'loyalty'],
    },
    {
        id: 'hvac',
        name: 'Plumbers and HVAC',
        aliases: ['hvac', 'plumber', 'home service', 'service dispatch'],
        defaultCategories: ['support', 'sales', 'it-ops', 'document-ops'],
        servicePackages: ['Emergency call triage', 'Dispatch and slot booking', 'Quote follow-up', 'Invoice extraction'],
        priorityKeywords: ['dispatch', 'emergency', 'quote', 'job', 'payment'],
    },
    {
        id: 'restaurant',
        name: 'Restaurants and Cafes',
        aliases: ['restaurant', 'cafe', 'food', 'dining'],
        defaultCategories: ['support', 'marketing', 'sales', 'ai'],
        servicePackages: ['Reservation handling', 'Menu and FAQ assistant', 'Promotion broadcast', 'Feedback and reputation loop'],
        priorityKeywords: ['reservation', 'menu', 'delivery', 'table', 'repeat customer'],
    },
    {
        id: 'realestate',
        name: 'Real Estate',
        aliases: ['real estate', 'property', 'broker', 'realtor'],
        defaultCategories: ['sales', 'marketing', 'support', 'ai'],
        servicePackages: ['Lead capture and enrichment', 'Showing scheduler', 'Follow-up campaign', 'Agent handoff automation'],
        priorityKeywords: ['lead', 'showing', 'property', 'qualification', 'follow-up'],
    },
    {
        id: 'legal',
        name: 'Law Firms',
        aliases: ['legal', 'law', 'attorney'],
        defaultCategories: ['support', 'document-ops', 'sales', 'ai'],
        servicePackages: ['Case intake', 'Consultation booking', 'Document extraction and routing', 'Client communication automation'],
        priorityKeywords: ['consultation', 'case', 'document', 'intake', 'urgent'],
    },
    {
        id: 'gym',
        name: 'Gyms and Fitness',
        aliases: ['gym', 'fitness', 'workout'],
        defaultCategories: ['marketing', 'sales', 'support', 'ai'],
        servicePackages: ['Trial lead capture', 'Class schedule assistant', 'Retention campaigns', 'Payment reminder automation'],
        priorityKeywords: ['trial', 'membership', 'class', 'renewal', 'retention'],
    },
    {
        id: 'vet',
        name: 'Veterinary Clinics',
        aliases: ['veterinary', 'vet', 'pet'],
        defaultCategories: ['support', 'document-ops', 'marketing', 'ai'],
        servicePackages: ['Appointment and emergency triage', 'Post-visit follow-up', 'Prescription reminders', 'Patient records intake'],
        priorityKeywords: ['pet', 'appointment', 'vaccination', 'urgent', 'follow-up'],
    },
    {
        id: 'autorepair',
        name: 'Auto Repair',
        aliases: ['auto', 'car', 'repair', 'garage'],
        defaultCategories: ['support', 'sales', 'document-ops', 'it-ops'],
        servicePackages: ['Service booking', 'Estimate delivery', 'Maintenance reminder campaigns', 'Invoice processing and payment chase'],
        priorityKeywords: ['service', 'estimate', 'repair', 'maintenance', 'payment'],
    },
    {
        id: 'insurance',
        name: 'Insurance Agencies',
        aliases: ['insurance', 'policy', 'claim'],
        defaultCategories: ['support', 'document-ops', 'sales', 'ai'],
        servicePackages: ['Lead qualification', 'Policy FAQ assistant', 'Claim intake workflow', 'Payment and renewal reminders'],
        priorityKeywords: ['claim', 'policy', 'renewal', 'quote', 'document'],
    },
    {
        id: 'education',
        name: 'Tutoring and Education',
        aliases: ['education', 'tutoring', 'school', 'academy'],
        defaultCategories: ['sales', 'support', 'marketing', 'ai'],
        servicePackages: ['Enrollment capture', 'Class reminder flows', 'Student support chatbot', 'Progress and report automation'],
        priorityKeywords: ['enrollment', 'class', 'student', 'parent', 'schedule'],
    },
    {
        id: 'logistics',
        name: 'Logistics and Courier',
        aliases: ['logistics', 'courier', 'shipping', 'delivery'],
        defaultCategories: ['support', 'it-ops', 'document-ops', 'ai'],
        servicePackages: ['Dispatch tracking updates', 'Shipment support assistant', 'Exception alerting', 'Delivery proof document processing'],
        priorityKeywords: ['dispatch', 'tracking', 'delivery', 'delay', 'proof'],
    },
    {
        id: 'ecommerce',
        name: 'Ecommerce and D2C',
        aliases: ['ecommerce', 'shopify', 'woocommerce', 'store'],
        defaultCategories: ['sales', 'marketing', 'support', 'document-ops', 'ai'],
        servicePackages: ['Lead and cart recovery', 'Order status automation', 'Support inbox triage', 'Invoice and returns document flow'],
        priorityKeywords: ['cart', 'order', 'refund', 'upsell', 'support'],
    },
    {
        id: 'saas',
        name: 'B2B SaaS',
        aliases: ['saas', 'software', 'b2b'],
        defaultCategories: ['sales', 'support', 'it-ops', 'marketing', 'ai'],
        servicePackages: ['Trial qualification', 'Onboarding assistant', 'Ticket triage', 'Usage and renewal nudges'],
        priorityKeywords: ['trial', 'onboarding', 'churn', 'ticket', 'renewal'],
    },
    {
        id: 'hr-recruiting',
        name: 'HR and Recruiting',
        aliases: ['hr', 'recruiting', 'hiring', 'talent'],
        defaultCategories: ['other', 'document-ops', 'support', 'ai'],
        servicePackages: ['Candidate screening', 'Interview scheduling', 'Offer document processing', 'Onboarding checklists'],
        priorityKeywords: ['candidate', 'interview', 'resume', 'onboarding', 'screening'],
    },
];

const TEMPLATE_LIBRARY: N8nTemplateKnowledgeItem[] = [
    {
        id: 'ai-rag-company-documents-gemini',
        title: 'RAG chatbot for company documents using Google Drive and Gemini',
        url: 'https://n8n.io/workflows/2753-rag-chatbot-for-company-documents-using-google-drive-and-gemini/',
        category: 'ai',
        subcategory: 'AI RAG',
        summary: 'Builds a document-grounded assistant for accurate answers from company files.',
        businessProblems: ['repetitive FAQ load', 'slow agent onboarding', 'inconsistent responses'],
        industries: ['saas', 'support', 'education', 'insurance', 'legal', 'dental', 'ecommerce'],
        keywords: ['rag', 'knowledge base', 'documents', 'faq', 'gemini'],
        requiredApps: ['Google Drive', 'Gemini', 'n8n'],
        triggerMode: 'polling',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'ai-chat-with-database',
        title: 'Chat with a database using AI',
        url: 'https://n8n.io/workflows/2090-chat-with-a-database-using-ai/',
        category: 'ai',
        subcategory: 'AI Agent',
        summary: 'Lets teams ask natural language questions over business data.',
        businessProblems: ['manual reporting', 'slow decision making', 'ops bottlenecks'],
        industries: ['saas', 'ecommerce', 'logistics', 'education', 'insurance'],
        keywords: ['database', 'sql', 'analytics', 'ai agent', 'reporting'],
        requiredApps: ['Postgres or MySQL', 'OpenAI or Gemini', 'n8n'],
        triggerMode: 'chat',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'ai-gmail-label-openai',
        title: 'Basic automatic Gmail email labelling with OpenAI and Gmail API',
        url: 'https://n8n.io/workflows/2740-basic-automatic-gmail-email-labelling-with-openai-and-gmail-api/',
        category: 'ai',
        subcategory: 'AI Inbox',
        summary: 'Classifies and labels incoming email automatically for cleaner ops.',
        businessProblems: ['inbox overload', 'slow response routing', 'missed priority email'],
        industries: ['support', 'legal', 'insurance', 'saas', 'hr-recruiting'],
        keywords: ['gmail', 'classification', 'inbox', 'auto label'],
        requiredApps: ['Gmail', 'OpenAI', 'n8n'],
        triggerMode: 'inbox',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'ai-analyze-landing-page',
        title: 'Analyze Landing Page with OpenAI and Get Optimization Tips',
        url: 'https://n8n.io/workflows/3100-analyze-landing-page-with-openai-and-get-optimization-tips/',
        category: 'ai',
        subcategory: 'AI CRO',
        summary: 'Runs AI review on landing pages for conversion optimization actions.',
        businessProblems: ['poor conversion rates', 'unclear messaging', 'weak CTA performance'],
        industries: ['saas', 'ecommerce', 'education', 'insurance', 'realestate'],
        keywords: ['landing page', 'cro', 'conversion', 'analysis'],
        requiredApps: ['OpenAI', 'HTTP', 'n8n'],
        triggerMode: 'manual',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'ai-local-rag-ollama',
        title: 'Local chatbot with retrieval augmented generation (RAG)',
        url: 'https://n8n.io/workflows/5148-local-chatbot-with-retrieval-augmented-generation-rag/',
        category: 'ai',
        subcategory: 'AI RAG',
        summary: 'Runs a private local RAG bot for teams that need stronger data control.',
        businessProblems: ['privacy constraints', 'offline assistant needs', 'high cloud model costs'],
        industries: ['legal', 'insurance', 'healthcare', 'hr-recruiting', 'it-ops'],
        keywords: ['local llm', 'ollama', 'rag', 'private ai'],
        requiredApps: ['Ollama', 'n8n'],
        triggerMode: 'chat',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'ai-whatsapp-rag-bot',
        title: 'AI-powered WhatsApp chatbot for text, voice, images, and PDF with RAG',
        url: 'https://n8n.io/workflows/4827-ai-powered-whatsapp-chatbot-for-text-voice-images-and-pdf-with-rag/',
        category: 'ai',
        subcategory: 'AI Multichannel',
        summary: 'Delivers multimodal support automation on WhatsApp with document-aware answers.',
        businessProblems: ['multichannel support pressure', 'voice support load', 'pdf question handling'],
        industries: ['support', 'ecommerce', 'education', 'insurance', 'logistics'],
        keywords: ['whatsapp', 'rag', 'voice', 'pdf', 'support chatbot'],
        requiredApps: ['WhatsApp', 'OpenAI or Gemini', 'n8n'],
        triggerMode: 'event',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'sales-company-news-before-call',
        title: 'Scrape recent news about a company before a call',
        url: 'https://n8n.io/workflows/2110-scrape-recent-news-about-a-company-before-a-call/',
        category: 'sales',
        subcategory: 'Lead Research',
        summary: 'Automatically briefs reps before calls with latest company context.',
        businessProblems: ['generic outreach', 'weak discovery calls', 'slow account prep'],
        industries: ['saas', 'realestate', 'insurance', 'legal', 'ecommerce'],
        keywords: ['sales prep', 'company research', 'news'],
        requiredApps: ['HTTP', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'sales-salesforce-from-sheets',
        title: 'Create Salesforce accounts based on Google Sheets data',
        url: 'https://n8n.io/workflows/1792-create-salesforce-accounts-based-on-google-sheets-data/',
        category: 'sales',
        subcategory: 'CRM Sync',
        summary: 'Moves lead rows into Salesforce automatically to reduce CRM lag.',
        businessProblems: ['manual crm entry', 'lead leakage', 'dirty pipeline updates'],
        industries: ['saas', 'insurance', 'realestate', 'education'],
        keywords: ['salesforce', 'crm', 'lead sync', 'google sheets'],
        requiredApps: ['Google Sheets', 'Salesforce', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'sales-generate-leads-google-maps',
        title: 'Generate leads with Google Maps',
        url: 'https://n8n.io/workflows/2605-generate-leads-with-google-maps/',
        category: 'sales',
        subcategory: 'Lead Generation',
        summary: 'Finds local business leads and stores them for outreach.',
        businessProblems: ['thin lead pipeline', 'manual prospecting', 'slow territory expansion'],
        industries: ['hvac', 'auto-repair', 'salon', 'realestate', 'education'],
        keywords: ['lead generation', 'maps', 'prospecting'],
        requiredApps: ['Google Maps', 'Google Sheets', 'n8n'],
        triggerMode: 'manual',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'sales-gmail-campaign-followup',
        title: 'Gmail campaign sender: bulk-send emails and follow up automatically',
        url: 'https://n8n.io/workflows/2137-gmail-campaign-sender-bulk-send-emails-and-follow-up-automatically-if-no-reply/',
        category: 'sales',
        subcategory: 'Outreach',
        summary: 'Runs multi-step outreach and auto follow-ups from a lead sheet.',
        businessProblems: ['missed follow-ups', 'low reply rates', 'manual outreach operations'],
        industries: ['saas', 'realestate', 'insurance', 'legal', 'education'],
        keywords: ['email outreach', 'follow up', 'campaign'],
        requiredApps: ['Gmail', 'Google Sheets', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'sales-lead-generation-maps-email-scraper',
        title: 'Lead generation system: Google Maps to email scraper with Sheets export',
        url: 'https://n8n.io/workflows/5385-lead-generation-system-google-maps-to-email-scraper-with-google-sheets-export/',
        category: 'sales',
        subcategory: 'Lead Enrichment',
        summary: 'Combines lead scraping and email discovery into one repeatable flow.',
        businessProblems: ['incomplete lead records', 'slow outreach start', 'manual enrichment'],
        industries: ['hvac', 'auto-repair', 'salon', 'restaurant', 'realestate'],
        keywords: ['email discovery', 'lead enrichment', 'maps'],
        requiredApps: ['Google Sheets', 'HTTP', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'sales-ai-sdr-pipeline',
        title: 'Run an AI SDR sales pipeline with OpenAI, Sheets, Gmail and Calendar',
        url: 'https://n8n.io/workflows/13529-run-an-ai-sdr-sales-pipeline-with-openai-google-sheets-gmail-and-calendar/',
        category: 'sales',
        subcategory: 'AI SDR',
        summary: 'Automates outreach, qualification, and meeting handoff in one pipeline.',
        businessProblems: ['manual lead qualification', 'slow booking velocity', 'fragmented sales ops'],
        industries: ['saas', 'realestate', 'insurance', 'education'],
        keywords: ['sdr', 'qualification', 'meeting booking', 'pipeline'],
        requiredApps: ['OpenAI', 'Google Sheets', 'Gmail', 'Google Calendar', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'itops-backup-workflows-google-drive',
        title: 'Backup all n8n workflows to Google Drive every 4 hours',
        url: 'https://n8n.io/workflows/2886-backup-all-n8n-workflows-to-google-drive-every-4-hours/',
        category: 'it-ops',
        subcategory: 'Reliability',
        summary: 'Creates scheduled backups to reduce automation outage risk.',
        businessProblems: ['config loss', 'recovery risk', 'missing backup discipline'],
        industries: ['saas', 'it-ops', 'support', 'ecommerce'],
        keywords: ['backup', 'workflow reliability', 'disaster recovery'],
        requiredApps: ['Google Drive', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'itops-report-errors-telegram',
        title: 'Report n8n workflow errors to Telegram',
        url: 'https://n8n.io/workflows/2159-report-n8n-workflow-errors-to-telegram/',
        category: 'it-ops',
        subcategory: 'Alerting',
        summary: 'Sends real-time workflow failure alerts to ops teams.',
        businessProblems: ['silent failures', 'slow incident response', 'missed SLA'],
        industries: ['saas', 'logistics', 'ecommerce', 'education'],
        keywords: ['error alert', 'incident response', 'monitoring'],
        requiredApps: ['Telegram', 'n8n'],
        triggerMode: 'event',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'itops-ssl-monitor-discord-notion',
        title: 'Comprehensive SSL certificate monitoring with Discord alerts and Notion',
        url: 'https://n8n.io/workflows/5673-comprehensive-ssl-certificate-monitoring-with-discord-alerts-and-notion-integration/',
        category: 'it-ops',
        subcategory: 'SecOps',
        summary: 'Tracks SSL expiry and posts actionable alerts to your team.',
        businessProblems: ['certificate expiry outages', 'manual certificate checks', 'compliance drift'],
        industries: ['saas', 'ecommerce', 'education', 'insurance'],
        keywords: ['ssl', 'certificate', 'security monitoring', 'alerts'],
        requiredApps: ['HTTP', 'Discord', 'Notion', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'itops-auto-heal-failing-workflows',
        title: 'Auto-heal failing workflows with Azure OpenAI, n8n API, and Slack alerts',
        url: 'https://n8n.io/workflows/13791-auto-heal-failing-workflows-with-azure-openai-n8n-api-and-slack-alerts/',
        category: 'it-ops',
        subcategory: 'DevOps',
        summary: 'Adds self-healing logic and operator alerts for broken automations.',
        businessProblems: ['frequent workflow failures', 'high maintenance burden', 'nighttime incidents'],
        industries: ['saas', 'it-ops', 'logistics'],
        keywords: ['self healing', 'slack alerts', 'devops', 'n8n api'],
        requiredApps: ['Slack', 'Azure OpenAI', 'n8n'],
        triggerMode: 'event',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'itops-url-downtime-alerts',
        title: 'Automatic monitoring of multiple URLs with downtime alerts',
        url: 'https://n8n.io/workflows/5298-automatic-monitoring-of-multiple-urls-with-downtime-alerts/',
        category: 'it-ops',
        subcategory: 'DevOps',
        summary: 'Checks websites at intervals and alerts stakeholders on downtime.',
        businessProblems: ['website downtime', 'late incident detection', 'manual uptime checks'],
        industries: ['ecommerce', 'saas', 'restaurant', 'realestate'],
        keywords: ['uptime', 'monitoring', 'downtime alert'],
        requiredApps: ['HTTP', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'itops-docker-monitor-telegram',
        title: 'Monitor and manage Docker containers with Telegram bot and AI log analysis',
        url: 'https://n8n.io/workflows/10476-monitor-and-manage-docker-containers-with-telegram-bot-and-ai-log-analysis/',
        category: 'it-ops',
        subcategory: 'DevOps',
        summary: 'Combines container telemetry with AI-assisted troubleshooting.',
        businessProblems: ['container instability', 'slow root-cause analysis', 'manual log triage'],
        industries: ['saas', 'it-ops'],
        keywords: ['docker', 'logs', 'ai analysis', 'telegram ops'],
        requiredApps: ['Telegram', 'Docker API', 'AI model', 'n8n'],
        triggerMode: 'event',
        requiresWebhook: true,
        freeTemplate: true,
    },
    {
        id: 'marketing-summarize-youtube-transcript',
        title: 'Summarize YouTube videos from transcript',
        url: 'https://n8n.io/workflows/2736-summarize-youtube-videos-from-transcript/',
        category: 'marketing',
        subcategory: 'Content Research',
        summary: 'Converts long-form video content into concise summaries for teams.',
        businessProblems: ['content repurposing delays', 'research bottlenecks', 'knowledge silos'],
        industries: ['marketing', 'education', 'saas', 'ecommerce'],
        keywords: ['youtube', 'summary', 'content', 'transcript'],
        requiredApps: ['HTTP', 'n8n'],
        triggerMode: 'manual',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'marketing-export-search-console-sheets',
        title: 'Export search console results to Google Sheets',
        url: 'https://n8n.io/workflows/2613-export-search-console-results-to-google-sheets/',
        category: 'marketing',
        subcategory: 'SEO Reporting',
        summary: 'Automates SEO data extraction for regular reporting.',
        businessProblems: ['manual seo reporting', 'late campaign insights', 'spreadsheet overhead'],
        industries: ['ecommerce', 'saas', 'education', 'realestate'],
        keywords: ['seo', 'search console', 'reporting'],
        requiredApps: ['Google Search Console', 'Google Sheets', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'marketing-linkedin-content-gpt4',
        title: 'Automated LinkedIn content creation with GPT-4 and DALL-E',
        url: 'https://n8n.io/workflows/4968-automated-linkedin-content-creation-with-gpt-4-and-dall-e-for-scheduled-posts/',
        category: 'marketing',
        subcategory: 'Social Media',
        summary: 'Generates and schedules branded LinkedIn content automatically.',
        businessProblems: ['inconsistent posting', 'content production delays', 'low brand reach'],
        industries: ['saas', 'realestate', 'legal', 'insurance'],
        keywords: ['linkedin', 'social media', 'content automation', 'schedule'],
        requiredApps: ['LinkedIn', 'OpenAI', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'marketing-multi-social-post-automation',
        title: 'AI-powered multi-social media post automation: Google Trends and Perplexity',
        url: 'https://n8n.io/workflows/4352-ai-powered-multi-social-media-post-automation-google-trends-and-perplexity-ai/',
        category: 'marketing',
        subcategory: 'Social Media',
        summary: 'Uses trend data to produce and publish multi-channel social posts.',
        businessProblems: ['weak social engagement', 'manual trend research', 'slow campaign execution'],
        industries: ['restaurant', 'salon', 'gym', 'ecommerce', 'education'],
        keywords: ['social posting', 'trend analysis', 'campaign'],
        requiredApps: ['Google Trends', 'Perplexity', 'Google Sheets', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'marketing-competitor-pricing-monitor',
        title: 'Automated competitor pricing monitor with Bright Data MCP and OpenAI',
        url: 'https://n8n.io/workflows/5948-automated-competitor-pricing-monitor-with-bright-data-mcp-and-openai/',
        category: 'marketing',
        subcategory: 'Market Research',
        summary: 'Tracks competitor pricing shifts and surfaces AI summaries.',
        businessProblems: ['pricing blind spots', 'manual competitive tracking', 'late pricing reaction'],
        industries: ['ecommerce', 'insurance', 'realestate', 'saas'],
        keywords: ['competitor', 'pricing', 'monitoring', 'market research'],
        requiredApps: ['Bright Data', 'OpenAI', 'Google Sheets', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'marketing-ai-web-research-sheets',
        title: 'AI-powered web research in Google Sheets with GPT and Bright Data',
        url: 'https://n8n.io/workflows/10119-ai-powered-web-research-in-google-sheets-with-gpt-and-bright-data/',
        category: 'marketing',
        subcategory: 'Market Research',
        summary: 'Builds structured research rows from web sources at scale.',
        businessProblems: ['manual research workload', 'unstructured lead intelligence', 'slow campaign prep'],
        industries: ['saas', 'realestate', 'ecommerce', 'hr-recruiting'],
        keywords: ['web research', 'lead intelligence', 'bright data', 'gpt'],
        requiredApps: ['Google Sheets', 'Bright Data', 'OpenAI', 'n8n'],
        triggerMode: 'event',
        requiresWebhook: true,
        freeTemplate: true,
    },
    {
        id: 'docops-cv-screening-ai',
        title: 'Automate CV screening with AI candidate analysis',
        url: 'https://n8n.io/workflows/7456-automate-cv-screening-with-ai-candidate-analysis/',
        category: 'document-ops',
        subcategory: 'Document Extraction',
        summary: 'Parses candidate resumes and returns structured screening insight.',
        businessProblems: ['resume review overload', 'slow shortlisting', 'inconsistent screening quality'],
        industries: ['hr-recruiting', 'saas', 'education', 'support'],
        keywords: ['cv', 'resume', 'screening', 'candidate'],
        requiredApps: ['Google Sheets', 'AI model', 'n8n'],
        triggerMode: 'manual',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'docops-extract-expenses-email-sheets',
        title: 'Extract expenses from emails and add to Google Sheets',
        url: 'https://n8n.io/workflows/1466-extract-expenses-from-emails-and-add-to-google-sheets/',
        category: 'document-ops',
        subcategory: 'Invoice Processing',
        summary: 'Reads finance emails and captures expense data in a structured ledger.',
        businessProblems: ['manual bookkeeping', 'expense tracking delays', 'invoice data errors'],
        industries: ['restaurant', 'salon', 'gym', 'ecommerce', 'legal'],
        keywords: ['expense', 'invoice', 'email parsing', 'ledger'],
        requiredApps: ['IMAP', 'Google Sheets', 'n8n'],
        triggerMode: 'inbox',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'docops-parse-pdf-llamaparse-airtable',
        title: 'Parse PDF with LlamaParse and save to Airtable',
        url: 'https://n8n.io/workflows/2661-parse-pdf-with-llamaparse-and-save-to-airtable/',
        category: 'document-ops',
        subcategory: 'Document Extraction',
        summary: 'Extracts structured fields from PDFs into operational tables.',
        businessProblems: ['manual data entry', 'slow compliance handling', 'document backlog'],
        industries: ['legal', 'insurance', 'dental', 'logistics', 'hr-recruiting'],
        keywords: ['pdf parsing', 'document extraction', 'airtable'],
        requiredApps: ['LlamaParse', 'Airtable', 'n8n'],
        triggerMode: 'manual',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'docops-ocr-large-docs-gemini',
        title: 'Process large documents with OCR using SubworkflowAI and Gemini',
        url: 'https://n8n.io/workflows/10566-process-large-documents-with-ocr-using-subworkflowai-and-gemini/',
        category: 'document-ops',
        subcategory: 'Document Extraction',
        summary: 'Handles OCR workflows for long and scanned documents.',
        businessProblems: ['scanned document lock-in', 'manual ocr workflows', 'low extraction accuracy'],
        industries: ['legal', 'insurance', 'dental', 'education', 'logistics'],
        keywords: ['ocr', 'scan', 'gemini', 'large document'],
        requiredApps: ['Google Drive', 'Gemini', 'n8n'],
        triggerMode: 'polling',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'docops-invoice-drive-to-sheets-ocr',
        title: 'Extract invoice data from Google Drive to Sheets with Mistral OCR and Gemini',
        url: 'https://n8n.io/workflows/4868-extract-invoice-data-from-google-drive-to-sheets-with-mistral-ocr-and-gemini/',
        category: 'document-ops',
        subcategory: 'Invoice Processing',
        summary: 'Automates invoice intake from cloud storage into accounting sheets.',
        businessProblems: ['invoice processing delay', 'typing mistakes', 'late reconciliation'],
        industries: ['ecommerce', 'restaurant', 'auto-repair', 'logistics', 'insurance'],
        keywords: ['invoice extraction', 'ocr', 'accounting automation'],
        requiredApps: ['Google Drive', 'Google Sheets', 'Mistral OCR', 'Gemini', 'n8n'],
        triggerMode: 'polling',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'docops-invoice-reminder-payment-tracker',
        title: 'AI-powered invoice reminder and payment tracker for finance and accounting',
        url: 'https://n8n.io/workflows/10111-ai-powered-invoice-reminder-and-payment-tracker-for-finance-and-accounting/',
        category: 'document-ops',
        subcategory: 'Invoice Processing',
        summary: 'Runs payment reminder and receivables tracking workflows end to end.',
        businessProblems: ['late payments', 'manual reminder follow-up', 'cash-flow uncertainty'],
        industries: ['legal', 'auto-repair', 'ecommerce', 'saas', 'education'],
        keywords: ['invoice reminder', 'payment tracker', 'accounts receivable'],
        requiredApps: ['Postgres', 'Email', 'AI model', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'support-human-in-loop-email-response',
        title: 'Human in the loop email response system using AI and IMAP',
        url: 'https://n8n.io/workflows/2907-a-very-simple-human-in-the-loop-email-response-system-using-ai-and-imap/',
        category: 'support',
        subcategory: 'Ticket Management',
        summary: 'Drafts replies with AI while keeping approval under human control.',
        businessProblems: ['slow support responses', 'quality risk in automation', 'agent overload'],
        industries: ['support', 'legal', 'insurance', 'education', 'ecommerce'],
        keywords: ['human in loop', 'email support', 'draft response'],
        requiredApps: ['IMAP', 'SMTP or Gmail', 'AI model', 'n8n'],
        triggerMode: 'inbox',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'support-branded-website-chatbot',
        title: 'Create a branded AI-powered website chatbot',
        url: 'https://n8n.io/workflows/2786-create-a-branded-ai-powered-website-chatbot/',
        category: 'support',
        subcategory: 'Support Chatbot',
        summary: 'Provides always-on website support and lead capture automation.',
        businessProblems: ['after-hours support gap', 'low web lead conversion', 'repetitive website questions'],
        industries: ['saas', 'realestate', 'dental', 'salon', 'ecommerce'],
        keywords: ['website chatbot', 'lead capture', 'support automation'],
        requiredApps: ['HTTP', 'AI model', 'n8n'],
        triggerMode: 'manual',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'support-whatsapp-google-docs-gemini',
        title: 'Customer support WhatsApp bot with Google Docs knowledge base and Gemini AI',
        url: 'https://n8n.io/workflows/4966-customer-support-whatsapp-bot-with-google-docs-knowledge-base-and-gemini-ai/',
        category: 'support',
        subcategory: 'Support Chatbot',
        summary: 'Combines WhatsApp support with document-grounded responses and escalation.',
        businessProblems: ['whatsapp support volume', 'inconsistent answers', 'manual handoff delays'],
        industries: ['ecommerce', 'education', 'insurance', 'logistics', 'clinic'],
        keywords: ['whatsapp support', 'knowledge base', 'gemini'],
        requiredApps: ['WhatsApp', 'Google Docs', 'Gemini', 'Google Sheets', 'n8n'],
        triggerMode: 'event',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'support-dhl-shipment-tracking-bot',
        title: 'Automated DHL shipment tracking bot for forms and email inquiries',
        url: 'https://n8n.io/workflows/9876-automated-dhl-shipment-tracking-bot-for-web-forms-and-email-inquiries/',
        category: 'support',
        subcategory: 'Support Chatbot',
        summary: 'Automates order and shipment status responses from support channels.',
        businessProblems: ['high where-is-my-order volume', 'slow tracking responses', 'manual shipment lookup'],
        industries: ['logistics', 'ecommerce', 'retail'],
        keywords: ['tracking bot', 'shipment support', 'order status'],
        requiredApps: ['DHL API', 'Email', 'n8n'],
        triggerMode: 'inbox',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'support-gmail-ai-email-manager',
        title: 'Gmail AI Email Manager',
        url: 'https://n8n.io/workflows/4722-gmail-ai-email-manager/',
        category: 'support',
        subcategory: 'Ticket Management',
        summary: 'Manages triage, labeling, and suggested replies for support inboxes.',
        businessProblems: ['ticket backlog', 'manual triage', 'response inconsistency'],
        industries: ['saas', 'education', 'insurance', 'legal', 'clinic'],
        keywords: ['gmail manager', 'ticket triage', 'support inbox'],
        requiredApps: ['Gmail', 'AI model', 'n8n'],
        triggerMode: 'inbox',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'support-itsm-classification-servicenow',
        title: 'Automate ITSM ticket classification and resolution using Gemini, Qdrant and ServiceNow',
        url: 'https://n8n.io/workflows/10241-automate-itsm-ticket-classification-and-resolution-using-gemini-qdrant-and-servicenow/',
        category: 'support',
        subcategory: 'Ticket Management',
        summary: 'Classifies and routes ITSM tickets with retrieval-enhanced AI support.',
        businessProblems: ['misrouted tickets', 'slow incident response', 'service desk overload'],
        industries: ['saas', 'it-ops', 'enterprise support'],
        keywords: ['itsm', 'servicenow', 'ticket classification', 'resolution'],
        requiredApps: ['ServiceNow', 'Gemini', 'Qdrant', 'n8n'],
        triggerMode: 'event',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'other-hiring-keka-gpt4',
        title: 'Automate end-to-end hiring with Keka, Google Sheets, Gmail and GPT-4',
        url: 'https://n8n.io/workflows/13517-automate-end-to-end-hiring-with-keka-google-sheets-gmail-and-gpt-4/',
        category: 'other',
        subcategory: 'HR',
        summary: 'Automates recruiting stages from intake to candidate communication.',
        businessProblems: ['slow hiring pipeline', 'manual recruiter workload', 'candidate drop-off'],
        industries: ['hr-recruiting', 'saas', 'education'],
        keywords: ['hiring', 'recruiting', 'candidate pipeline'],
        requiredApps: ['Keka', 'Google Sheets', 'Gmail', 'OpenAI', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'other-onboard-employees-google-forms',
        title: 'Onboard employees from Google Forms with Slack, Jira, and GitHub access',
        url: 'https://n8n.io/workflows/14221-onboard-employees-from-google-forms-with-slack-jira-and-github-access/',
        category: 'other',
        subcategory: 'HR',
        summary: 'Automates onboarding tasks and account provisioning checklists.',
        businessProblems: ['manual onboarding', 'missed setup steps', 'slow first-week productivity'],
        industries: ['hr-recruiting', 'saas', 'it-ops'],
        keywords: ['onboarding', 'employee setup', 'access provisioning'],
        requiredApps: ['Google Forms', 'Slack', 'Jira', 'GitHub', 'n8n'],
        triggerMode: 'polling',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'other-ai-scrum-master-assistant',
        title: 'AI-powered Scrum Master assistant with OpenAI, Slack and Asana integration',
        url: 'https://n8n.io/workflows/5478-ai-powered-scrum-master-assistant-with-openai-slack-and-asana-integration/',
        category: 'other',
        subcategory: 'Project Management',
        summary: 'Improves delivery cadence with automated standup and blocker workflows.',
        businessProblems: ['status reporting overhead', 'blocked tasks', 'poor sprint visibility'],
        industries: ['saas', 'it-ops', 'agency'],
        keywords: ['scrum', 'project management', 'standup', 'blocker'],
        requiredApps: ['OpenAI', 'Slack', 'Asana', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'other-email-to-jira-ticket',
        title: 'AI-powered email to Jira ticket creation with Llama 3.2',
        url: 'https://n8n.io/workflows/5473-ai-powered-email-to-jira-ticket-creation-with-llama-32/',
        category: 'other',
        subcategory: 'Project Management',
        summary: 'Creates Jira issues from inbound emails with AI summarization.',
        businessProblems: ['missing issue capture', 'manual ticket creation', 'slow engineering handoff'],
        industries: ['saas', 'it-ops', 'support'],
        keywords: ['jira', 'email to ticket', 'issue triage'],
        requiredApps: ['Gmail', 'Jira', 'Llama model', 'n8n'],
        triggerMode: 'inbox',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'other-stock-analysis-assistant',
        title: 'AI-powered stock analysis assistant with Telegram, Claude and GPT-4o Vision',
        url: 'https://n8n.io/workflows/5163-ai-powered-stock-analysis-assistant-with-telegram-claude-and-gpt-4o-vision/',
        category: 'other',
        subcategory: 'Crypto Trading',
        summary: 'Runs a market-analysis assistant with multi-model reasoning and alerts.',
        businessProblems: ['manual market watch', 'slow trade analysis', 'missed opportunities'],
        industries: ['finance', 'other'],
        keywords: ['stock analysis', 'trading alerts', 'telegram assistant'],
        requiredApps: ['Telegram', 'Claude', 'OpenAI', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
    {
        id: 'other-personalized-newsletter-gemini',
        title: 'Create a personalized daily newsletter with Gemini AI and RSS feeds',
        url: 'https://n8n.io/workflows/10196-create-a-personalized-daily-newsletter-with-google-gemini-ai-and-rss-feeds/',
        category: 'other',
        subcategory: 'Personal Productivity',
        summary: 'Generates daily digests from selected news streams.',
        businessProblems: ['information overload', 'manual curation effort', 'missed market updates'],
        industries: ['saas', 'marketing', 'education', 'finance'],
        keywords: ['newsletter', 'rss', 'digest', 'gemini'],
        requiredApps: ['RSS', 'Gemini', 'Email', 'n8n'],
        triggerMode: 'schedule',
        requiresWebhook: false,
        freeTemplate: true,
    },
];

const STOP_WORDS = new Set([
    'a', 'an', 'and', 'the', 'for', 'to', 'of', 'in', 'on', 'is', 'are', 'with', 'from', 'by', 'or', 'as', 'at', 'be', 'our', 'your', 'my', 'we', 'you', 'it', 'that', 'this', 'into', 'than', 'all', 'need', 'needs', 'using',
]);

export class NicheWorkflowRagService {
    getCategories() {
        return CATEGORY_OPTIONS;
    }

    getIndustryProfiles() {
        return INDUSTRY_PROFILES.map((profile) => ({
            id: profile.id,
            name: profile.name,
            aliases: profile.aliases,
            servicePackages: profile.servicePackages,
            defaultCategories: profile.defaultCategories,
        }));
    }

    getTemplateLibrary(filters?: { category?: WorkflowCategory; avoidWebhooks?: boolean; industryId?: string }) {
        const avoidWebhooks = filters?.avoidWebhooks !== false;

        return TEMPLATE_LIBRARY.filter((template) => {
            if (filters?.category && template.category !== filters.category) {
                return false;
            }
            if (avoidWebhooks && template.requiresWebhook) {
                return false;
            }
            if (filters?.industryId && !template.industries.includes(filters.industryId)) {
                return false;
            }
            return true;
        });
    }

    recommend(request: NicheRagRecommendationRequest) {
        const avoidWebhooks = request.avoidWebhooks !== false;
        const maxTemplates = Math.max(4, Math.min(request.maxTemplates || 12, 24));
        const requestedCategories = this.normalizeCategories(request.categories);

        const industry = this.resolveIndustry(request.industryId, request.industryName, request.problemStatement);
        const activeCategories = requestedCategories.length > 0
            ? requestedCategories
            : industry?.defaultCategories || CATEGORY_OPTIONS.map((item) => item.id);

        const queryTokens = this.buildQueryTokens(request, industry);

        const ranked = TEMPLATE_LIBRARY
            .filter((template) => activeCategories.includes(template.category))
            .filter((template) => !(avoidWebhooks && template.requiresWebhook))
            .map((template) => this.rankTemplate(template, queryTokens, industry, activeCategories))
            .filter((template) => template.score > 0)
            .sort((left, right) => right.score - left.score)
            .slice(0, maxTemplates);

        const groupedByCategory = activeCategories.map((category) => ({
            category,
            templates: ranked.filter((template) => template.category === category),
        }));

        const requiredApps = Array.from(new Set(ranked.flatMap((item) => item.requiredApps))).sort();

        return {
            industry: {
                id: industry?.id || request.industryId || null,
                name: industry?.name || request.industryName || 'Custom Industry',
                matched: Boolean(industry),
                servicePackages: industry?.servicePackages || this.defaultServicePackages(request.problemStatement),
            },
            filters: {
                categories: activeCategories,
                avoidWebhooks,
                maxTemplates,
            },
            summary: this.buildSummary(industry, ranked, request.problemStatement),
            templates: ranked.map((item) => ({
                id: item.id,
                title: item.title,
                url: item.url,
                category: item.category,
                subcategory: item.subcategory,
                summary: item.summary,
                triggerMode: item.triggerMode,
                requiredApps: item.requiredApps,
                matchedKeywords: item.matchedKeywords,
                matchedProblems: item.matchedProblems,
                webhookFree: !item.requiresWebhook,
                score: item.score,
            })),
            groupedByCategory,
            implementationBlueprint: this.buildImplementationBlueprint(industry, ranked),
            noWebhookExecutionModel: {
                strategy: 'Use polling, schedule, inbox, and internal event triggers instead of public webhooks.',
                acceptedTriggerModes: ['schedule', 'polling', 'inbox', 'manual', 'chat', 'event'],
                rejectedPattern: 'Public webhook listener dependencies are excluded from recommendation output.',
            },
            setupChecklist: this.buildSetupChecklist(requiredApps, industry),
            discoveredIndustries: this.getEmergingIndustryOpportunities(),
            generatedAt: new Date().toISOString(),
        };
    }

    private normalizeCategories(categories?: WorkflowCategory[]) {
        if (!Array.isArray(categories)) {
            return [];
        }

        const valid = new Set<WorkflowCategory>(CATEGORY_OPTIONS.map((item) => item.id));
        return Array.from(new Set(categories.filter((category): category is WorkflowCategory => valid.has(category as WorkflowCategory))));
    }

    private resolveIndustry(industryId?: string, industryName?: string, problemStatement?: string) {
        if (industryId) {
            const byId = INDUSTRY_PROFILES.find((profile) => profile.id === industryId);
            if (byId) {
                return byId;
            }
        }

        const searchText = `${industryName || ''} ${problemStatement || ''}`.toLowerCase();
        if (!searchText.trim()) {
            return null;
        }

        return INDUSTRY_PROFILES.find((profile) => {
            if (searchText.includes(profile.name.toLowerCase())) {
                return true;
            }
            return profile.aliases.some((alias) => searchText.includes(alias.toLowerCase()));
        }) || null;
    }

    private buildQueryTokens(request: NicheRagRecommendationRequest, industry: IndustryProfile | null) {
        const fields = [
            request.problemStatement,
            ...(request.goals || []),
            ...(request.painPoints || []),
            request.industryName || '',
            industry?.name || '',
            ...(industry?.priorityKeywords || []),
        ];

        return this.tokenize(fields.join(' '));
    }

    private tokenize(input: string) {
        return input
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, ' ')
            .split(/\s+/)
            .map((token) => token.trim())
            .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
    }

    private rankTemplate(
        template: N8nTemplateKnowledgeItem,
        queryTokens: string[],
        industry: IndustryProfile | null,
        activeCategories: WorkflowCategory[]
    ): RankedTemplate {
        const templateTokens = this.tokenize([
            template.title,
            template.summary,
            template.subcategory,
            ...template.businessProblems,
            ...template.keywords,
            ...template.industries,
        ].join(' '));

        const querySet = new Set(queryTokens);
        const templateSet = new Set(templateTokens);

        const matchedKeywords = Array.from(querySet).filter((token) => templateSet.has(token));
        const matchedProblems = template.businessProblems.filter((problem) => {
            const problemTokens = this.tokenize(problem);
            return problemTokens.some((token) => querySet.has(token));
        });

        let score = 0;

        if (activeCategories.includes(template.category)) {
            score += 12;
        }

        if (industry && template.industries.includes(industry.id)) {
            score += 22;
        }

        if (industry && template.industries.some((value) => industry.aliases.includes(value))) {
            score += 8;
        }

        score += matchedKeywords.length * 4;
        score += matchedProblems.length * 5;

        if (template.category === 'ai' && querySet.has('automation')) {
            score += 4;
        }

        if (template.triggerMode === 'schedule' || template.triggerMode === 'inbox' || template.triggerMode === 'polling') {
            score += 3;
        }

        if (!template.requiresWebhook) {
            score += 2;
        }

        return {
            ...template,
            score,
            matchedKeywords,
            matchedProblems,
        };
    }

    private buildSummary(industry: IndustryProfile | null, templates: RankedTemplate[], problemStatement: string) {
        const categoryCount = new Set(templates.map((template) => template.category)).size;
        const top = templates[0];

        if (!top) {
            return `No strong template match was found for "${problemStatement}". Try adding more goals or selecting more categories.`;
        }

        const industryLabel = industry?.name || 'your niche';
        return `Prepared a webhook-free automation stack for ${industryLabel} using ${templates.length} free templates across ${categoryCount} categories. Highest-fit template: ${top.title}.`;
    }

    private buildImplementationBlueprint(industry: IndustryProfile | null, templates: RankedTemplate[]) {
        const industryLabel = industry?.name || 'the selected business';

        const byCategory = (category: WorkflowCategory) => templates.filter((item) => item.category === category);

        return [
            {
                phase: 'Phase 1 - Capture and Route',
                objective: `Capture every inbound request for ${industryLabel} without manual triage.`,
                actions: [
                    'Set up inbox and chat triggers so every inquiry lands in one queue.',
                    'Apply AI classification templates to tag intent and urgency.',
                    'Route high-intent leads or urgent support requests to the correct team lane.',
                ],
                suggestedTemplates: byCategory('support').slice(0, 2).map((item) => item.title),
            },
            {
                phase: 'Phase 2 - Automate Core Work',
                objective: 'Replace repetitive operations with deterministic workflows and approvals.',
                actions: [
                    'Automate document extraction, CRM updates, and follow-up steps.',
                    'Run sales and marketing loops for nurturing, reminders, and reactivation.',
                    'Keep fallback human approvals for sensitive outcomes.',
                ],
                suggestedTemplates: templates
                    .filter((item) => ['sales', 'document-ops', 'marketing'].includes(item.category))
                    .slice(0, 3)
                    .map((item) => item.title),
            },
            {
                phase: 'Phase 3 - Reliability and Scale',
                objective: 'Make automations observable, resilient, and easy for non-technical teams.',
                actions: [
                    'Enable error alerts, backups, and health checks for every workflow.',
                    'Track conversion, response time, and backlog reduction metrics weekly.',
                    'Promote best performers to always-on schedules and retire low-impact flows.',
                ],
                suggestedTemplates: byCategory('it-ops').slice(0, 3).map((item) => item.title),
            },
        ];
    }

    private buildSetupChecklist(requiredApps: string[], industry: IndustryProfile | null) {
        const base = [
            'Decide one owner for automation operations and approvals.',
            'Prepare accounts and API credentials for the listed tools.',
            'Define escalation rules for high-risk or high-value conversations.',
            'Create a weekly review slot to monitor conversion and failure alerts.',
        ];

        const industrySpecific = industry
            ? [`Map your top 5 ${industry.name} customer intents and expected outcomes before go-live.`]
            : ['Map your top 5 customer intents and expected outcomes before go-live.'];

        return {
            requiredApps,
            actions: [...industrySpecific, ...base],
        };
    }

    private defaultServicePackages(problemStatement: string) {
        const tokens = this.tokenize(problemStatement);
        if (tokens.includes('support') || tokens.includes('ticket')) {
            return ['Ticket triage and response automation', 'Escalation and SLA management', 'Knowledge-grounded assistant'];
        }
        if (tokens.includes('sales') || tokens.includes('lead')) {
            return ['Lead capture and enrichment', 'Nurture campaigns', 'Meeting booking automation'];
        }
        return ['Lead and support intake automation', 'Document and ops automation', 'Reporting and optimization loop'];
    }

    private getEmergingIndustryOpportunities() {
        return [
            {
                industry: 'D2C Ecommerce Support Ops',
                whyNow: 'High support volume and margin pressure require aggressive automation.',
                highImpactServices: ['Order status autopilot', 'Return and refund triage', 'Cart recovery and upsell flows'],
            },
            {
                industry: 'B2B SaaS RevOps',
                whyNow: 'Growth teams need lower CAC and faster trial-to-paid conversion.',
                highImpactServices: ['AI SDR handoff', 'Onboarding assistant', 'Renewal risk playbooks'],
            },
            {
                industry: 'Recruiting and HR Shared Services',
                whyNow: 'Resume volume and onboarding load keep increasing without headcount growth.',
                highImpactServices: ['Resume scoring', 'Interview scheduling', 'Onboarding checklist automation'],
            },
        ];
    }
}

export const nicheWorkflowRagService = new NicheWorkflowRagService();
