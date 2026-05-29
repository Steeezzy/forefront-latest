// Per-integration metadata for detail pages — mirrors Tidio's integration page structure
// Each entry has: key features, setup steps, FAQ, related integrations, tags

export interface IntegrationMeta {
  id: string;
  headline: string;        // "Get more done with Questron and [X] Integration"
  subtitle: string;        // marketing subtitle
  overviewText: string;    // rich overview paragraph
  keyFeatures: string[];   // bullet list
  setupSteps: string[];    // numbered steps
  faq: { question: string; answer: string }[];
  tags: string[];          // e.g. ["CRM", "Lead Capture"]
  helpCenterUrl?: string;
  relatedIds: string[];    // IDs of related integrations to show at bottom
}

export const INTEGRATION_META: Record<string, IntegrationMeta> = {
  // ─── BI & Analytics ──────────────────────────────────────
  zapier: {
    id: 'zapier',
    headline: 'Get more done with Questron and Zapier Integration',
    subtitle: 'Use Zapier to sync chats, leads, and customer details instantly across your entire tool stack.',
    overviewText: 'Link Questron and Zapier to supercharge your workflow. Every contact, message, or bot response can be automatically forwarded to your CRM, spreadsheets, email tools, or other apps. Skip manual exports, respond to leads quickly, and keep operations running smoothly as volume grows.',
    keyFeatures: [
      'Send new leads where they belong — automatically push contacts from Questron straight into your CRM or any other tool.',
      'Get instant alerts — receive email notifications for every new message so you never miss a conversation.',
      'Skip manual exporting — let Zapier handle contact syncing and other repetitive tasks for you.',
      'Automate Shopify-specific flows — track shipping checks, order status requests, and other actions with ease.',
      'Connect Questron to thousands of apps — build simple automations to move data anywhere you need it.',
    ],
    setupSteps: [
      'Open the Flow editor in Questron and add the "Send to Zapier" action to any flow.',
      'Follow the on-screen instructions to connect your Zapier account.',
      'Choose which data fields to send in the Zap configuration.',
      'Test the automation, then activate it — data flows automatically from that point.',
    ],
    faq: [
      { question: 'How do I set up Zapier with Questron?', answer: 'Open Questron\'s Flow editor, add the "Send to Zapier" action to any flow, then follow instructions to connect your Zapier account. Data from that flow will be sent automatically to your chosen app.' },
      { question: 'What workflows can I automate with this integration?', answer: 'Common uses include sending new leads from chat to a CRM, logging chat contacts to spreadsheets, triggering emails or Slack alerts when chats start, or tracking orders and questions from your Shopify store.' },
      { question: 'Do I need coding skills to use the integration?', answer: 'No. The integration works via Questron\'s visual Flow editor and Zapier\'s no-code interface. You can build useful automations without writing a single line of code.' },
    ],
    tags: ['Workflow Automation'],
    relatedIds: ['hubspot', 'salesforce', 'google-analytics', 'slack', 'mailchimp'],
  },

  'google-analytics': {
    id: 'google-analytics',
    headline: 'Get more done with Questron and Google Analytics Integration',
    subtitle: 'Track every chat event in Google Analytics and understand how conversations drive leads, engagement, and conversions.',
    overviewText: 'Connect Questron with Google Analytics and get a clear view of how visitors interact with your widget, conversations, and flows. Track key events like started chats, completed chats, and lead submissions directly in GA to understand what sparks engagement and where customers convert. Use real data to improve support quality and optimize your website without guesswork.',
    keyFeatures: [
      'Track user interactions with the Questron widget, chats, and Flows inside Google Analytics.',
      'Measure leads from pre-chat surveys and identify high-intent visitors.',
      'Monitor chat-based conversions using custom events.',
      'Start tracking instantly after connecting your Google Tag ID.',
    ],
    setupSteps: [
      'Navigate to Integrations in the Questron admin panel.',
      'Click on Google Analytics and enter your Google Tag ID (e.g. G-XXXXXXXXXX).',
      'Click Connect — Questron immediately starts sending events to Google Analytics.',
      'View events in your GA4 property under Events.',
    ],
    faq: [
      { question: 'What events does Questron send to Google Analytics?', answer: 'Questron sends predefined events including chat started, chat finished, conversations triggered by flows, and leads collected. These help you understand engagement patterns and customer actions.' },
      { question: 'How do I connect Google Analytics to Questron?', answer: 'Enter your Google Tag ID in the integration panel and click Connect. Once the widget is active on your site, events are sent immediately. No additional setup required.' },
      { question: 'Can I create custom conversions based on Questron events?', answer: 'Yes. Any event Questron sends to Google Analytics can be marked as a conversion, letting you track which conversations or Flows contribute to revenue or lead generation.' },
    ],
    tags: ['Analytics'],
    relatedIds: ['google-tag-manager', 'zapier', 'shopify', 'hubspot'],
  },

  'google-tag-manager': {
    id: 'google-tag-manager',
    headline: 'Get more done with Questron and Google Tag Manager Integration',
    subtitle: 'Streamline data tracking and customer engagement with seamless integration between Questron and Google Tag Manager.',
    overviewText: 'Connect Google Tag Manager to capture every interaction with your Questron widget and pass it to your existing analytics setup. Once enabled, Questron automatically pushes widget events to the GTM dataLayer, so you can forward them to tools like Google Analytics or ad platforms. This keeps tracking consistent, reduces manual setup, and helps teams understand how chat impacts conversions and engagement.',
    keyFeatures: [
      'Automatically push Questron widget events to the Google Tag Manager dataLayer.',
      'Track visitor interactions such as chat opens, messages, and availability changes.',
      'Enhance analytics of tools like Facebook, TikTok, Twitter with data from Questron widget for better insights.',
      'Reuse Questron events in analytics and advertising tools connected to GTM.',
      'Keep event data consistent across tools using one central setup.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Google Tag Manager.',
      'Enter your GTM Container ID (e.g. GTM-XXXXXXX).',
      'Click Connect — Questron will immediately start pushing events to the dataLayer.',
      'Configure tags and triggers in your GTM account to forward the events.',
    ],
    faq: [
      { question: 'What exactly happens after I enable the Google Tag Manager integration?', answer: 'Once enabled, Questron automatically pushes all widget-related events to the Google Tag Manager dataLayer. Every time a visitor interacts with the widget, the event is sent immediately and becomes available inside GTM for further use.' },
      { question: 'What types of widget interactions are tracked?', answer: 'The integration tracks events like opening the widget, starting a conversation, submitting a review, and message interactions. These reflect real visitor actions and can be reused in analytics and advertising tools.' },
      { question: 'Can I use these events with tools other than Google Analytics?', answer: 'Yes. Google Tag Manager acts as the middle layer. Once events are in the dataLayer, they can be sent to any third-party tool supported by GTM, including marketing and advertising platforms.' },
    ],
    tags: ['Analytics'],
    relatedIds: ['google-analytics', 'zapier', 'shopify'],
  },

  // ─── Communication Channels ──────────────────────────────
  facebook: {
    id: 'facebook',
    headline: 'Get more done with Questron and Facebook Integration',
    subtitle: 'Handle Messenger messages and comments from your customers directly in your panel.',
    overviewText: 'Connect your Facebook Business Page with Questron and manage all incoming Messenger conversations and page comments from a single inbox. Respond to customers in real time, assign chats to team members, and use automation to handle common questions — all without switching between tools.',
    keyFeatures: [
      'Receive and reply to Facebook Messenger messages directly in the Questron inbox.',
      'Monitor and respond to page comments from within the panel.',
      'Use Flow automations to handle common Messenger questions automatically.',
      'Assign Messenger conversations to specific team members.',
      'View full visitor context alongside Messenger conversations.',
    ],
    setupSteps: [
      'Go to Settings → Channels in the Questron panel.',
      'Click Connect Facebook and authorize your Facebook Business Page.',
      'Select which pages you want to receive messages from.',
      'Messenger conversations will start appearing in your Questron inbox.',
    ],
    faq: [
      { question: 'What Facebook features are supported?', answer: 'You can receive and reply to Messenger direct messages and respond to page comments. All conversations appear in the Questron unified inbox alongside other channels.' },
      { question: 'Do I need a Facebook Business account?', answer: 'Yes. You need a Facebook Business Page connected to a Meta Business suite to authorize the integration.' },
      { question: 'Can I automate responses to Messenger messages?', answer: 'Yes. You can use Questron Flows to automatically respond to common Messenger questions, qualify leads, and route conversations to the right agents.' },
    ],
    tags: ['Messaging', 'Omnichannel Inbox'],
    relatedIds: ['instagram', 'whatsapp', 'email', 'slack'],
  },

  email: {
    id: 'email',
    headline: 'Get more done with Questron and Email Integration',
    subtitle: 'Connect your mailbox and receive or send emails directly from the app.',
    overviewText: 'With Questron, you can connect your email inbox and handle all email conversations alongside live chat, Messenger, and other channels in one unified dashboard. Never miss a customer inquiry again — every email becomes a conversation thread your team can assign, tag, and resolve.',
    keyFeatures: [
      'Receive and send emails directly from the Questron inbox.',
      'Manage email conversations alongside live chat and social channels.',
      'Assign emails to team members and track response times.',
      'Create tickets from email conversations for structured follow-up.',
      'Use templates and canned responses for faster email replies.',
    ],
    setupSteps: [
      'Go to Settings → Channels in the Questron panel.',
      'Click Connect Email and choose your email provider.',
      'Authorize your email account (IMAP/SMTP or OAuth).',
      'Incoming emails will start appearing in your Questron inbox.',
    ],
    faq: [
      { question: 'Which email providers are supported?', answer: 'Questron supports Gmail, Outlook, and any IMAP/SMTP email provider. OAuth-based connection is available for Gmail and Outlook.' },
      { question: 'Will emails still appear in my regular inbox?', answer: 'Yes. Questron creates a copy of incoming emails in its inbox. Your original email inbox remains unchanged.' },
      { question: 'Can I send emails from Questron?', answer: 'Yes. You can compose and reply to emails directly from the Questron panel using your connected email address.' },
    ],
    tags: ['Messaging', 'Omnichannel Inbox'],
    relatedIds: ['facebook', 'instagram', 'whatsapp', 'slack'],
  },

  instagram: {
    id: 'instagram',
    headline: 'Get more done with Questron and Instagram Integration',
    subtitle: 'Reply to Direct Messages, Stories, and comments from your Instagram Business account.',
    overviewText: 'Connect your Instagram Business account with Questron and manage all Instagram customer interactions from a single inbox. Reply to Direct Messages, respond to Story mentions, and manage comments — all without switching between apps. Use automation to handle common questions and route conversations to the right agents.',
    keyFeatures: [
      'Receive and reply to Instagram Direct Messages in the Questron inbox.',
      'Respond to Story mentions and replies from within the panel.',
      'Monitor and reply to post comments.',
      'Use Flow automations for common Instagram questions.',
      'View full visitor context alongside Instagram conversations.',
    ],
    setupSteps: [
      'Go to Settings → Channels in the Questron panel.',
      'Click Connect Instagram and authorize your Instagram Business account.',
      'Your Instagram account must be connected to a Facebook Business Page.',
      'DMs, Story replies, and comments will start appearing in your inbox.',
    ],
    faq: [
      { question: 'Do I need a Business account?', answer: 'Yes. Instagram integration requires an Instagram Business or Creator account connected to a Facebook Business Page.' },
      { question: 'Which message types are supported?', answer: 'Direct Messages, Story replies and mentions, and post comments are all supported. They appear in your unified inbox alongside other channels.' },
      { question: 'Can I automate Instagram responses?', answer: 'Yes. You can use Questron Flows to automatically respond to common Instagram questions, qualify leads, and route conversations.' },
    ],
    tags: ['Messaging', 'Omnichannel Inbox'],
    relatedIds: ['facebook', 'whatsapp', 'email'],
  },

  whatsapp: {
    id: 'whatsapp',
    headline: 'Get more done with Questron and WhatsApp Integration',
    subtitle: 'Automate your WhatsApp communication to speed up response times with a personal, human touch.',
    overviewText: 'Integrate Questron with WhatsApp Business and manage all WhatsApp conversations from your unified inbox. Turn conversations into support tickets or sales opportunities. Combine smart automation with a personal, human touch to deliver exceptional customer experiences at scale.',
    keyFeatures: [
      'Receive and reply to WhatsApp messages directly in the Questron inbox.',
      'Turn WhatsApp conversations into support tickets or sales opportunities.',
      'Use Flow automations for common WhatsApp questions.',
      'Send proactive WhatsApp messages using message templates.',
      'View full customer context alongside WhatsApp conversations.',
    ],
    setupSteps: [
      'Go to Settings → Channels in the Questron panel.',
      'Click Connect WhatsApp and follow the WhatsApp Business API setup.',
      'Verify your business phone number.',
      'WhatsApp conversations will start appearing in your inbox.',
    ],
    faq: [
      { question: 'Do I need WhatsApp Business API?', answer: 'Yes. The integration uses WhatsApp Business API through Meta Business Suite. You\'ll need a verified business phone number.' },
      { question: 'Can I send proactive messages?', answer: 'Yes. You can send template messages to customers who have opted in, subject to WhatsApp Business API policies.' },
      { question: 'Are automated responses supported?', answer: 'Yes. You can use Questron Flows to automatically respond to common questions, qualify leads, and route conversations to the right agents.' },
    ],
    tags: ['Messaging', 'Omnichannel Inbox'],
    relatedIds: ['facebook', 'instagram', 'email', 'slack'],
  },

  // ─── CRM ─────────────────────────────────────────────────
  'agile-crm': {
    id: 'agile-crm',
    headline: 'Get more done with Questron and Agile CRM Integration',
    subtitle: 'Create new contacts straight from the conversation and keep your CRM updated automatically.',
    overviewText: 'Connect Questron with Agile CRM to automatically create and update contacts whenever a visitor chats with your team. Map contact fields between both platforms, sync conversation history, and give your agents full context without switching tools.',
    keyFeatures: [
      'Auto-create new contacts in Agile CRM from chat conversations.',
      'Sync contact properties with configurable field mapping.',
      'View Agile CRM contact details inside the Questron panel during conversations.',
      'Send chat transcripts to CRM when conversations are resolved.',
      'Manual or custom field mapping to match your CRM structure.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Agile CRM.',
      'Enter your Agile CRM domain, email, and API key.',
      'Click Connect — Questron will test the connection automatically.',
      'Optionally configure field mappings in the Settings tab.',
    ],
    faq: [
      { question: 'Where do I find my Agile CRM API key?', answer: 'Log in to Agile CRM, go to Admin Settings → API & Analytics → API Key. Copy the REST API key.' },
      { question: 'Can I control which fields sync?', answer: 'Yes. Use the Field Mapping editor in the Settings tab to map Questron fields to Agile CRM fields.' },
      { question: 'Are existing contacts updated automatically?', answer: 'Yes. When a returning visitor chats, their existing Agile CRM contact is updated with the latest information.' },
    ],
    tags: ['CRM', 'Lead Capture'],
    relatedIds: ['hubspot', 'salesforce', 'pipedrive', 'zoho', 'zendesk-sell'],
  },

  'zendesk-sell': {
    id: 'zendesk-sell',
    headline: 'Get more done with Questron and Zendesk Sell Integration',
    subtitle: 'Create new leads straight from the conversation and keep your sales pipeline updated.',
    overviewText: 'Connect Questron with Zendesk Sell to push new leads directly into your sales pipeline. Every chat conversation can become a qualified lead in your CRM. Map contact fields, sync conversation history, and keep your sales team informed without extra manual work.',
    keyFeatures: [
      'Auto-create new leads in Zendesk Sell from chat conversations.',
      'Sync contact properties with configurable field mapping.',
      'View Zendesk Sell lead details inside the Questron panel.',
      'Send chat transcripts to CRM when conversations are resolved.',
      'Configurable field mapping to match your pipeline structure.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Zendesk Sell.',
      'Enter your Zendesk Sell API Token.',
      'Click Connect — Questron will verify the connection.',
      'Configure field mappings in the Settings tab if needed.',
    ],
    faq: [
      { question: 'Where do I find my Zendesk Sell API token?', answer: 'In Zendesk Sell, go to Settings → Integrations → API → OAuth Access Tokens and generate a new token.' },
      { question: 'Are leads created automatically?', answer: 'Yes. When auto-sync is enabled, every new chat visitor with an email is automatically created as a lead in Zendesk Sell.' },
    ],
    tags: ['CRM', 'Lead Capture'],
    relatedIds: ['hubspot', 'salesforce', 'pipedrive', 'zendesk', 'agile-crm'],
  },

  pipedrive: {
    id: 'pipedrive',
    headline: 'Get more done with Questron and Pipedrive Integration',
    subtitle: 'Create new deals straight from the conversation and keep your pipeline moving.',
    overviewText: 'Connect Questron with Pipedrive to automatically create persons and deals whenever a visitor chats with your team. Map contact fields, sync conversation history, and give your sales team full context without leaving the chat panel.',
    keyFeatures: [
      'Auto-create persons and deals in Pipedrive from chat conversations.',
      'Sync contact properties with configurable field mapping.',
      'View Pipedrive contact details inside the Questron panel.',
      'Send chat transcripts to CRM when conversations are resolved.',
      'OAuth-based connection for secure authentication.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Pipedrive.',
      'Click "Connect with OAuth" to authorize Questron with your Pipedrive account.',
      'Alternatively, enter your API Token manually.',
      'Configure field mappings in the Settings tab if needed.',
    ],
    faq: [
      { question: 'Can I use OAuth to connect?', answer: 'Yes. Pipedrive supports OAuth-based authentication. Click "Connect with OAuth" and authorize Questron in your Pipedrive account.' },
      { question: 'Are deals created automatically?', answer: 'Yes. When auto-sync is enabled, Questron creates deals in your default pipeline for each new qualified conversation.' },
      { question: 'Can I map custom fields?', answer: 'Yes. Use the Field Mapping editor to map Questron contact fields to any Pipedrive person or deal field.' },
    ],
    tags: ['CRM', 'Lead Capture'],
    relatedIds: ['hubspot', 'salesforce', 'zoho', 'agile-crm', 'zendesk-sell'],
  },

  zoho: {
    id: 'zoho',
    headline: 'Get more done with Questron and Zoho CRM Integration',
    subtitle: 'Create new contacts straight from the conversation and keep your CRM organized.',
    overviewText: 'Connect Questron with Zoho CRM to automatically create and update contacts whenever a visitor chats. Map contact fields between platforms, view CRM data in the chat panel, and give agents full context for every conversation.',
    keyFeatures: [
      'Auto-create new contacts in Zoho CRM from chat conversations.',
      'Sync contact properties with configurable field mapping.',
      'View Zoho CRM contact details inside the Questron panel.',
      'Send chat transcripts to CRM when conversations are resolved.',
      'Configurable field mapping to match your CRM modules.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Zoho CRM.',
      'Enter your Zoho CRM Access Token.',
      'Click Connect — Questron will test the connection automatically.',
      'Configure field mappings in the Settings tab.',
    ],
    faq: [
      { question: 'Where do I get my Zoho access token?', answer: 'In Zoho CRM, go to Setup → Developer Space → APIs → OAuth. Generate a self-client token with the CRM scopes you need.' },
      { question: 'Which Zoho modules are supported?', answer: 'Contacts and Leads modules are supported. New contacts from chat are created as Contacts or Leads based on your configuration.' },
    ],
    tags: ['CRM', 'Lead Capture'],
    relatedIds: ['hubspot', 'salesforce', 'pipedrive', 'agile-crm'],
  },

  hubspot: {
    id: 'hubspot',
    headline: 'Get more done with Questron and HubSpot Integration',
    subtitle: 'Capture new leads and turn prospects into customers without any hassle, keeping your CRM updated automatically.',
    overviewText: 'Link your Questron live chat to HubSpot CRM to keep your contacts and conversation records in sync. Whenever a visitor chats or signs up via Questron, their information flows automatically to HubSpot, reducing manual entry. This means fewer errors, faster follow-ups, and a more organized CRM.',
    keyFeatures: [
      'Auto-create new contacts — subscribers captured in Questron are added as contacts in HubSpot automatically.',
      'Sync existing contact data — map and update contact properties (email, name, phone, etc.) from Questron to HubSpot fields.',
      'Send chat transcripts to CRM — when a conversation is solved, the transcript is saved as a note in the contact\'s HubSpot profile.',
      'Access HubSpot contacts without leaving Questron — see contact details directly inside the panel.',
      'Manual or custom mapping — customize which Questron contact properties map to which HubSpot fields.',
    ],
    setupSteps: [
      'Navigate to Integrations, then go to HubSpot.',
      'Click "Connect with OAuth" to authorize your HubSpot account.',
      'Choose your HubSpot account and grant the requested permissions.',
      'Optionally customize field mappings, then click Finish.',
    ],
    faq: [
      { question: 'How do I connect Questron with HubSpot?', answer: 'Navigate to Integrations, click HubSpot, click "Connect with OAuth", authorize the connection, choose your HubSpot account, optionally map properties, and click Finish.' },
      { question: 'Can I control which contact fields sync?', answer: 'Yes. During setup or afterwards in Settings, you can map standard and custom Questron fields to corresponding HubSpot properties.' },
      { question: 'Does HubSpot data appear during a conversation?', answer: 'Yes. When a visitor already exists in HubSpot, you can see their contact details right inside the Questron panel, giving agents full context without switching tools.' },
    ],
    tags: ['CRM', 'Lead Capture'],
    relatedIds: ['salesforce', 'pipedrive', 'zoho', 'zapier', 'mailchimp'],
  },

  salesforce: {
    id: 'salesforce',
    headline: 'Get more done with Questron and Salesforce Integration',
    subtitle: 'Sync customer conversations, contacts, and context between Questron and Salesforce automatically.',
    overviewText: 'Bring customer conversations and CRM data together in one smooth flow. The Questron and Salesforce integration automatically creates or updates contacts and saves conversation history as notes. Your team gets less manual work, cleaner data, and full context for every follow-up — all without changing how they work day to day.',
    keyFeatures: [
      'Automatically create and update Salesforce contacts from Questron conversations.',
      'Sync new subscribers and contact details to Salesforce.',
      'Export chat transcripts as notes when conversations are marked as solved.',
      'Map selected contact properties between Questron and Salesforce.',
      'Keep customer data organized inside your CRM.',
    ],
    setupSteps: [
      'Navigate to Integrations, then go to Salesforce.',
      'Click "Connect with OAuth" to authorize your Salesforce organization.',
      'Grant the requested permissions in the Salesforce consent screen.',
      'Configure field mappings in the Settings tab if needed.',
    ],
    faq: [
      { question: 'What happens after I connect Questron with Salesforce?', answer: 'Customer conversations start feeding your CRM automatically. New contacts are created or updated, and conversation history is saved so your team always has context in Salesforce.' },
      { question: 'Do I need to manually export conversations?', answer: 'No. Once a conversation is marked as solved, its transcript can be sent to Salesforce automatically as a note.' },
      { question: 'Can this integration fit our existing CRM setup?', answer: 'Yes. You can choose which contact fields are synced, so Salesforce stays structured the way your team needs it.' },
    ],
    tags: ['CRM', 'Lead Capture'],
    relatedIds: ['hubspot', 'pipedrive', 'zoho', 'zapier'],
  },

  // ─── E-commerce ──────────────────────────────────────────
  bigcommerce: {
    id: 'bigcommerce',
    headline: 'Get more done with Questron and BigCommerce Integration',
    subtitle: 'Provide an excellent shopping experience and turn visitors into happy customers.',
    overviewText: 'Connect Questron with your BigCommerce store to deliver personalized support right where customers shop. See order history, answer product questions, and use automation to recover abandoned carts — all from one dashboard.',
    keyFeatures: [
      'View customer order history directly in the chat panel.',
      'Look up orders by email or order ID without leaving Questron.',
      'Answer product questions with full store context at your fingertips.',
      'Use Flow automations to proactively engage shoppers.',
      'Sync customer data between Questron and BigCommerce.',
    ],
    setupSteps: [
      'Navigate to Integrations and click BigCommerce.',
      'Enter your BigCommerce Store Hash and Access Token.',
      'Click Connect — Questron will verify the connection.',
      'Start using order lookup and customer context in conversations.',
    ],
    faq: [
      { question: 'Where do I find my Store Hash?', answer: 'Your Store Hash is in the URL of your BigCommerce admin panel (e.g. store-xxxxx.mybigcommerce.com — the "xxxxx" part).' },
      { question: 'Can I look up orders during a conversation?', answer: 'Yes. Use the order lookup feature to search by email or order ID directly from the chat panel.' },
    ],
    tags: ['Ecommerce'],
    relatedIds: ['shopify', 'woocommerce', 'adobe-commerce', 'prestashop'],
  },

  'adobe-commerce': {
    id: 'adobe-commerce',
    headline: 'Get more done with Questron and Adobe Commerce Integration',
    subtitle: 'Increase your sales by reaching out to your customers with personalized communication.',
    overviewText: 'Connect Questron with Adobe Commerce (Magento) to deliver personalized support across your store. Access order data, customer history, and product information right inside the chat panel.',
    keyFeatures: [
      'View customer order history directly in the chat panel.',
      'Look up orders by email or order ID.',
      'Answer product questions with full store context.',
      'Use Flow automations to engage shoppers proactively.',
      'Sync customer data between platforms.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Adobe Commerce.',
      'Enter your Adobe Commerce Store URL and Access Token.',
      'Click Connect — Questron will verify the connection.',
      'Order lookup and customer context are now available in conversations.',
    ],
    faq: [
      { question: 'How do I generate an access token?', answer: 'In Adobe Commerce admin, go to System → Integrations → Add New Integration. Create a new integration and copy the Access Token.' },
    ],
    tags: ['Ecommerce'],
    relatedIds: ['shopify', 'woocommerce', 'bigcommerce', 'prestashop'],
  },

  prestashop: {
    id: 'prestashop',
    headline: 'Get more done with Questron and PrestaShop Integration',
    subtitle: 'Talk to your online customers, gather new leads, and boost your sales in one go.',
    overviewText: 'Connect Questron with PrestaShop to chat with your store visitors in real time, view order information, and use automation to convert browsers into buyers.',
    keyFeatures: [
      'Add the Questron chat widget to your PrestaShop store.',
      'View customer order history in the chat panel.',
      'Use Flow automations to engage visitors and recover carts.',
      'Gather leads from pre-chat surveys.',
      'Sync customer data between Questron and PrestaShop.',
    ],
    setupSteps: [
      'Navigate to Integrations and click PrestaShop.',
      'Enter your PrestaShop Store URL and API Key.',
      'Click Connect — Questron verifies the connection.',
      'The chat widget will appear on your PrestaShop store.',
    ],
    faq: [
      { question: 'How do I get my PrestaShop API key?', answer: 'In your PrestaShop admin, go to Advanced Parameters → Webservice. Enable the webservice and create a new key with the permissions you need.' },
    ],
    tags: ['Ecommerce'],
    relatedIds: ['shopify', 'woocommerce', 'bigcommerce', 'adobe-commerce'],
  },

  shopify: {
    id: 'shopify',
    headline: 'Get more done with Questron and Shopify Integration',
    subtitle: 'Chat with your visitors and increase sales by turning them into happy customers.',
    overviewText: 'Bring Questron to your Shopify store to answer product questions, recover abandoned carts, and build trust through authentic support. Use dedicated Shopify features like cart preview, order management from inbox, and 40+ no-code automation templates to create outstanding shopping experiences.',
    keyFeatures: [
      'Preview customer carts to make personalized product recommendations.',
      'Perform Shopify-specific actions directly from your inbox — cancel orders, offer refunds, change shipping addresses.',
      'View full order history and offer detailed answers based on customer purchase history.',
      'Create rich tickets with Shopify data — turn conversations into tickets with order context.',
      'Use 40+ no-code automation templates to recover carts, recommend products, and unlock free shipping.',
      'Automate common questions about products, delivery, and returns with Conversa AI.',
    ],
    setupSteps: [
      'Open Questron in the Shopify App Store and install the dedicated app.',
      'Create and configure your Questron account.',
      'Activate the Questron app in your Shopify admin panel.',
    ],
    faq: [
      { question: 'Can I see what customers have in their cart?', answer: 'Yes. Questron shows real-time cart preview so you can recommend products, send discounts, and respond to purchase-related questions faster.' },
      { question: 'Can I manage orders from Questron?', answer: 'Yes. You can cancel orders, offer refunds, and change shipping addresses directly from your Questron inbox without leaving the dashboard.' },
      { question: 'Does Questron work with multiple Shopify stores?', answer: 'Yes. You can connect multiple Shopify stores and monitor all messages from a unified dashboard.' },
    ],
    tags: ['Ecommerce'],
    relatedIds: ['woocommerce', 'bigcommerce', 'zapier', 'google-analytics'],
  },

  woocommerce: {
    id: 'woocommerce',
    headline: 'Get more done with Questron and WooCommerce Integration',
    subtitle: 'Supercharge your WooCommerce store with seamless chat integration and real-time product sharing.',
    overviewText: 'Connect Questron with WooCommerce to engage your website visitors at the right time. View order and customer data in real-time, look up orders during conversations, and use automation to make sure visitors finalize their purchases.',
    keyFeatures: [
      'View customer order history and details in the chat panel.',
      'Look up orders by email or order ID during conversations.',
      'Send product cards and recommendations to visitors in chat.',
      'Use Flow automations to recover abandoned carts.',
      'Sync customer data between Questron and WooCommerce.',
    ],
    setupSteps: [
      'Navigate to Integrations and click WooCommerce.',
      'Enter your Store URL, Consumer Key, and Consumer Secret.',
      'Click Connect — Questron will verify the connection.',
      'Order lookup and customer context are now available.',
    ],
    faq: [
      { question: 'Where do I find my WooCommerce API keys?', answer: 'In WordPress admin, go to WooCommerce → Settings → Advanced → REST API. Click "Add Key" and create new API keys with read permissions.' },
      { question: 'Can I look up orders during a conversation?', answer: 'Yes. Use the order lookup feature to search by customer email or order ID right from the chat panel.' },
    ],
    tags: ['Ecommerce'],
    relatedIds: ['shopify', 'bigcommerce', 'wordpress', 'prestashop'],
  },

  wordpress: {
    id: 'wordpress',
    headline: 'Get more done with Questron and WordPress Integration',
    subtitle: 'Deliver authentic, efficient support on WordPress with trustworthy AI and human-centred tools.',
    overviewText: 'Add the Questron chat widget to your WordPress site in seconds. Engage visitors in real time, answer questions, and capture leads — all without leaving your WordPress dashboard. Simply paste the widget snippet or install the plugin.',
    keyFeatures: [
      'Install the chat widget on your WordPress site with a simple snippet.',
      'Engage website visitors in real time with live chat.',
      'Capture leads from pre-chat surveys and contact forms.',
      'Use Flow automations to qualify visitors and route conversations.',
      'Works with any WordPress theme and page builder.',
    ],
    setupSteps: [
      'Navigate to Integrations and click WordPress.',
      'Copy the widget embed snippet provided.',
      'Paste the snippet into your WordPress theme\'s header (or use a plugin like "Insert Headers and Footers").',
      'The chat widget will appear on your WordPress site.',
    ],
    faq: [
      { question: 'Do I need a WordPress plugin?', answer: 'No. You can add the widget using a simple JavaScript snippet. However, a WordPress plugin is also available for easier installation.' },
      { question: 'Does it work with page builders?', answer: 'Yes. The Questron widget works with any WordPress theme, Elementor, Divi, Gutenberg, and other page builders.' },
    ],
    tags: ['Website Builder'],
    relatedIds: ['woocommerce', 'shopify', 'google-analytics'],
  },

  // ─── Marketing Automation ────────────────────────────────
  klaviyo: {
    id: 'klaviyo',
    headline: 'Get more done with Questron and Klaviyo Integration',
    subtitle: 'Automatically add new subscribers from chat to your Klaviyo mailing list.',
    overviewText: 'Connect Questron with Klaviyo and grow your email list from every conversation. When visitors share their email through pre-chat surveys, Flows, or chat, they\'re automatically added to your chosen Klaviyo list — no manual work required.',
    keyFeatures: [
      'Add subscribers from pre-chat surveys when visitors share their email.',
      'Collect emails in Flows using the Subscribe for Mailing action.',
      'Update subscriber status manually in the visitor profile.',
      'Sync new contacts directly to your chosen Klaviyo list.',
      'Streamline subscriber management with automated workflows.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Klaviyo.',
      'Enter your Klaviyo API Key.',
      'Click Connect and select the default list for new subscribers.',
      'Subscribers collected via chat will automatically sync to Klaviyo.',
    ],
    faq: [
      { question: 'Where do I find my Klaviyo API key?', answer: 'In Klaviyo, go to Account → Settings → API Keys. Create a new private API key with list and subscriber permissions.' },
      { question: 'Can I choose which list subscribers are added to?', answer: 'Yes. During setup, you select the default Klaviyo list. You can change it anytime in the Settings tab.' },
    ],
    tags: ['Email Marketing', 'Lead Capture'],
    relatedIds: ['mailchimp', 'activecampaign', 'omnisend', 'mailerlite', 'brevo'],
  },

  mailchimp: {
    id: 'mailchimp',
    headline: 'Get more done with Questron and Mailchimp Integration',
    subtitle: 'Automatically send new contacts to your Mailchimp list and keep subscribers organized effortlessly.',
    overviewText: 'Connect Questron with Mailchimp to grow your mailing list from every conversation. Add subscribers instantly from pre-chat surveys, Flows, or manual updates. No extra steps, no juggling tools. Keep your email database clean, updated, and ready for personalized communication.',
    keyFeatures: [
      'Add subscribers from pre-chat surveys when visitors share their email.',
      'Collect emails in Flows using the Subscribe for Mailing action.',
      'Update subscriber status manually in the visitor profile or contacts list.',
      'Sync new contacts directly to your chosen Mailchimp list.',
      'Streamline subscriber management with an automated, reliable workflow.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Mailchimp.',
      'Enter your Mailchimp API Key.',
      'Click Connect and select the Mailchimp list for new subscribers.',
      'Subscribers from chat will automatically sync to Mailchimp.',
    ],
    faq: [
      { question: 'How do I add new subscribers from Questron to Mailchimp?', answer: 'Visitors can be added through pre-chat surveys, automated Flows with the Subscribe for Mailing action, or by manually updating a contact\'s subscriber status. All updates sync to your Mailchimp list.' },
      { question: 'Can I choose which Mailchimp list receives new subscribers?', answer: 'Yes. During setup, you select the Mailchimp list you want to sync with. Every new subscriber is automatically added to that list.' },
      { question: 'Do I need technical skills?', answer: 'No. The Mailchimp integration installs in a few clicks, and you can manage subscribers directly from the Questron panel without extra configuration.' },
    ],
    tags: ['Email Marketing', 'Lead Capture'],
    relatedIds: ['klaviyo', 'activecampaign', 'omnisend', 'mailerlite', 'brevo'],
  },

  activecampaign: {
    id: 'activecampaign',
    headline: 'Get more done with Questron and ActiveCampaign Integration',
    subtitle: 'Automatically add new subscribers from chat to your ActiveCampaign lists.',
    overviewText: 'Connect Questron with ActiveCampaign to keep your marketing lists growing with every conversation. Subscribers collected through chat, pre-chat surveys, and Flows are automatically synced to your ActiveCampaign account.',
    keyFeatures: [
      'Add subscribers from pre-chat surveys when visitors share their email.',
      'Collect emails in Flows using the Subscribe for Mailing action.',
      'Sync new contacts to your chosen ActiveCampaign list.',
      'Update subscriber status from the visitor profile.',
      'Automate list management without manual exports.',
    ],
    setupSteps: [
      'Navigate to Integrations and click ActiveCampaign.',
      'Enter your Account URL and API Key.',
      'Click Connect and select your default list.',
      'Subscribers from chat will automatically sync to ActiveCampaign.',
    ],
    faq: [
      { question: 'Where do I find my ActiveCampaign API key?', answer: 'In ActiveCampaign, go to Settings → Developer. Your API URL and API Key are displayed there.' },
      { question: 'Can contacts be added to automations?', answer: 'Yes. Once contacts arrive in your ActiveCampaign list, they trigger any automations you\'ve set up for that list.' },
    ],
    tags: ['Email Marketing', 'Lead Capture'],
    relatedIds: ['mailchimp', 'klaviyo', 'omnisend', 'mailerlite', 'brevo'],
  },

  omnisend: {
    id: 'omnisend',
    headline: 'Get more done with Questron and Omnisend Integration',
    subtitle: 'Automatically add new subscribers from chat to your Omnisend mailing list.',
    overviewText: 'Connect Questron with Omnisend and automatically sync subscribers from chat conversations, pre-chat surveys, and Flows. Keep your email and SMS marketing lists growing with zero manual effort.',
    keyFeatures: [
      'Add subscribers from pre-chat surveys when visitors share their email.',
      'Collect emails in Flows using the Subscribe for Mailing action.',
      'Sync new contacts directly to your Omnisend account.',
      'Update subscriber status from the visitor profile.',
      'Streamline email and SMS marketing list management.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Omnisend.',
      'Enter your Omnisend API Key.',
      'Click Connect — subscribers will start syncing automatically.',
    ],
    faq: [
      { question: 'Where do I find my Omnisend API key?', answer: 'In Omnisend, go to Profile → Integrations & API → API Keys. Create a new key or copy an existing one.' },
    ],
    tags: ['Email Marketing', 'Lead Capture'],
    relatedIds: ['mailchimp', 'klaviyo', 'activecampaign', 'mailerlite', 'brevo'],
  },

  mailerlite: {
    id: 'mailerlite',
    headline: 'Get more done with Questron and MailerLite Integration',
    subtitle: 'Automatically add new subscribers from chat to your MailerLite mailing list.',
    overviewText: 'Connect Questron with MailerLite to grow your subscriber list from every conversation. Emails collected through pre-chat surveys, Flows, and manual updates sync automatically to MailerLite.',
    keyFeatures: [
      'Add subscribers from pre-chat surveys when visitors share their email.',
      'Collect emails in Flows using the Subscribe for Mailing action.',
      'Sync contacts directly to your MailerLite subscriber groups.',
      'Update subscriber status from the visitor profile.',
      'Automate list management without manual CSV exports.',
    ],
    setupSteps: [
      'Navigate to Integrations and click MailerLite.',
      'Enter your MailerLite API Key.',
      'Click Connect and select your default subscriber group.',
      'Subscribers from chat automatically sync to MailerLite.',
    ],
    faq: [
      { question: 'Where do I find my MailerLite API key?', answer: 'In MailerLite, go to Developer API area from your profile menu. Generate a new API key or copy an existing one.' },
    ],
    tags: ['Email Marketing', 'Lead Capture'],
    relatedIds: ['mailchimp', 'klaviyo', 'activecampaign', 'omnisend', 'brevo'],
  },

  brevo: {
    id: 'brevo',
    headline: 'Get more done with Questron and Brevo Integration',
    subtitle: 'Automatically add new subscribers from chat to your Brevo (formerly Sendinblue) mailing list.',
    overviewText: 'Connect Questron with Brevo to keep your marketing lists growing with every customer interaction. Subscribers from pre-chat surveys, Flows, and chat conversations sync automatically to Brevo.',
    keyFeatures: [
      'Add subscribers from pre-chat surveys when visitors share their email.',
      'Collect emails in Flows using the Subscribe for Mailing action.',
      'Sync new contacts directly to your Brevo contact lists.',
      'Update subscriber status from the visitor profile.',
      'Streamline email and SMS marketing with automated sync.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Brevo.',
      'Enter your Brevo API Key.',
      'Click Connect and select your default contact list.',
      'Subscribers from chat automatically sync to Brevo.',
    ],
    faq: [
      { question: 'Where do I find my Brevo API key?', answer: 'In Brevo, go to SMTP & API → API Keys. Create a new v3 API key or copy an existing one.' },
    ],
    tags: ['Email Marketing', 'Lead Capture'],
    relatedIds: ['mailchimp', 'klaviyo', 'activecampaign', 'omnisend', 'mailerlite'],
  },

  // ─── Rating & Reviews ────────────────────────────────────
  judgeme: {
    id: 'judgeme',
    headline: 'Get more done with Questron and Judge.me Integration',
    subtitle: 'Collect more reviews and build trust with your customers.',
    overviewText: 'Connect Judge.me with Questron to collect product reviews directly through chat conversations. Build social proof, encourage repeat purchases, and give customers an easy way to share their experience.',
    keyFeatures: [
      'Request product reviews directly from chat conversations.',
      'View existing reviews for products discussed in chat.',
      'Automate review request timing after order delivery.',
      'Build trust and social proof with customer reviews.',
      'Manage review collection alongside customer support.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Judge.me.',
      'Enter your Judge.me API Token and Shop Domain.',
      'Click Connect — Questron will verify the connection.',
      'Start requesting reviews from the conversation panel.',
    ],
    faq: [
      { question: 'Where do I find my Judge.me API token?', answer: 'In your Judge.me dashboard, go to Settings → API → API Token. Copy the token and paste it in Questron.' },
      { question: 'Can I automate review requests?', answer: 'Yes. You can use Flows to automatically request reviews after a conversation is resolved or after an order is delivered.' },
    ],
    tags: ['Reviews', 'Social Proof'],
    relatedIds: ['shopify', 'woocommerce', 'bigcommerce'],
  },

  // ─── Customer Support ────────────────────────────────────
  zendesk: {
    id: 'zendesk',
    headline: 'Get more done with Questron and Zendesk Integration',
    subtitle: 'Create new tickets from the chat window and manage them in Zendesk.',
    overviewText: 'Easily create Zendesk tickets from any Questron chat and keep every issue organized with full customer details. When a conversation requires follow-up, turn it into a Zendesk ticket with a single click — complete with chat history and customer context.',
    keyFeatures: [
      'Create Zendesk tickets directly from chat conversations.',
      'Include full chat transcript and customer details in tickets.',
      'Search and view existing Zendesk tickets from the Questron panel.',
      'Add comments to existing tickets without leaving Questron.',
      'Keep customer support organized across both platforms.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Zendesk.',
      'Enter your Zendesk Subdomain, Email, and API Token.',
      'Click Connect — Questron will verify the connection.',
      'Start creating tickets from conversations.',
    ],
    faq: [
      { question: 'Where do I find my Zendesk API token?', answer: 'In Zendesk, go to Admin → Channels → API. Enable Token Access and create a new API token.' },
      { question: 'Are chat transcripts included in tickets?', answer: 'Yes. When you create a ticket from a conversation, the full chat transcript and customer details are automatically included.' },
      { question: 'Can I update tickets from Questron?', answer: 'Yes. You can add comments to existing Zendesk tickets directly from the Questron panel.' },
    ],
    tags: ['Ticketing', 'Customer Support', 'Omnichannel Inbox'],
    relatedIds: ['slack', 'hubspot', 'salesforce', 'zapier'],
  },

  // ─── Communication Channels (cont.) ──────────────────────
  slack: {
    id: 'slack',
    headline: 'Get more done with Questron and Slack Integration',
    subtitle: 'Get real-time notifications in Slack for new conversations, tickets, and ratings.',
    overviewText: 'Keep your team in the loop with real-time Slack notifications for every important event in Questron. Get alerted about new conversations, ticket updates, customer ratings, and offline messages — all delivered to the Slack channels your team already monitors.',
    keyFeatures: [
      'Receive real-time Slack notifications for new conversations.',
      'Get alerted when new tickets are created.',
      'Monitor customer ratings and feedback in Slack.',
      'Receive notifications for offline messages.',
      'Choose which Slack channels receive which notifications.',
    ],
    setupSteps: [
      'Navigate to Integrations and click Slack.',
      'Enter your Slack Bot Token and Default Channel ID.',
      'Click Connect — Questron will send a test message to verify.',
      'Configure which notification types to send in the Settings tab.',
    ],
    faq: [
      { question: 'How do I create a Slack Bot Token?', answer: 'Go to api.slack.com/apps, create a new app, add the "chat:write" scope under OAuth & Permissions, install the app to your workspace, and copy the Bot Token.' },
      { question: 'Can I choose which events trigger notifications?', answer: 'Yes. In the Settings tab, you can enable or disable notifications for new conversations, tickets, ratings, and offline messages.' },
      { question: 'Can I send notifications to different channels?', answer: 'Yes. You set a default channel, and you can customize notification routing in your Slack app configuration.' },
    ],
    tags: ['Notifications', 'Team Communication'],
    relatedIds: ['zapier', 'email', 'zendesk'],
  },
};

// Helper to get metadata for an integration (returns a default if not found)
export function getIntegrationMeta(id: string): IntegrationMeta | null {
  return INTEGRATION_META[id] || null;
}

// Get category label for tag display
export const TAG_COLORS: Record<string, string> = {
  'CRM': 'bg-blue-500/20 text-blue-400',
  'Lead Capture': 'bg-green-500/20 text-green-400',
  'Ecommerce': 'bg-purple-500/20 text-purple-400',
  'Email Marketing': 'bg-yellow-500/20 text-yellow-400',
  'Messaging': 'bg-pink-500/20 text-pink-400',
  'Omnichannel Inbox': 'bg-indigo-500/20 text-indigo-400',
  'Analytics': 'bg-cyan-500/20 text-cyan-400',
  'Workflow Automation': 'bg-orange-500/20 text-orange-400',
  'Website Builder': 'bg-gray-500/20 text-gray-400',
  'Notifications': 'bg-red-500/20 text-red-400',
  'Team Communication': 'bg-violet-500/20 text-violet-400',
  'Ticketing': 'bg-amber-500/20 text-amber-400',
  'Customer Support': 'bg-teal-500/20 text-teal-400',
  'Reviews': 'bg-emerald-500/20 text-emerald-400',
  'Social Proof': 'bg-lime-500/20 text-lime-400',
};
