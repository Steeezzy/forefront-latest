"use client";

import { useState } from 'react';
import { X, ChevronRight, Play, Info, Settings, Sliders, AlertTriangle } from 'lucide-react';

// ===================================================================
// NODE PARAMETER DEFINITIONS
// Each node subtype maps to its own set of configurable parameters.
// ===================================================================

interface ParamField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'toggle' | 'multiselect' | 'slider' | 'keyvalue' | 'json';
    placeholder?: string;
    options?: { label: string; value: string }[];
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: any;
    description?: string;
}

interface NodeConfig {
    description: string;
    howItWorks?: string;
    parameters: ParamField[];
    settings: ParamField[];
}

// Universal settings shared by most nodes
const COMMON_SETTINGS: ParamField[] = [
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Add notes about this node...', description: 'Internal notes (not shown to visitors)' },
    {
        key: 'on_error', label: 'On Error', type: 'select', options: [
            { label: 'Stop execution', value: 'stop' },
            { label: 'Continue anyway', value: 'continue' },
            { label: 'Use fallback output', value: 'fallback' },
        ], defaultValue: 'stop', description: 'What to do if this node fails'
    },
    { key: 'timeout_ms', label: 'Timeout (ms)', type: 'number', defaultValue: 10000, min: 1000, max: 60000, description: 'Max execution time for this node' },
    { key: 'retry_count', label: 'Retry on failure', type: 'number', defaultValue: 0, min: 0, max: 5 },
];

const NODE_CONFIGS: Record<string, NodeConfig> = {
    // === TRIGGERS ===
    first_visit: { description: 'Fires when a new visitor lands on your site for the first time.', parameters: [], settings: COMMON_SETTINGS },
    visitor_returns: {
        description: 'Fires when a previously seen visitor returns.', parameters: [
            { key: 'min_days_since', label: 'Min days since last visit', type: 'number', defaultValue: 1, min: 0, max: 365 },
        ], settings: COMMON_SETTINGS
    },
    visitor_opens_page: {
        description: 'Fires when the visitor navigates to a specific URL.', parameters: [
            { key: 'url_pattern', label: 'URL pattern', type: 'text', placeholder: 'e.g. /pricing or /products/*', description: 'Supports * wildcard' },
            {
                key: 'match_type', label: 'Match type', type: 'select', options: [
                    { label: 'Contains', value: 'contains' }, { label: 'Exact match', value: 'exact' }, { label: 'Regex', value: 'regex' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    visitor_scrolls: {
        description: 'Fires when the visitor scrolls to a certain depth on the page.', parameters: [
            { key: 'scroll_percentage', label: 'Scroll depth (%)', type: 'slider', min: 10, max: 100, step: 5, defaultValue: 50 },
        ], settings: COMMON_SETTINGS
    },
    visitor_clicks_chat: { description: 'Fires when the visitor clicks the chat widget icon.', parameters: [], settings: COMMON_SETTINGS },
    visitor_says: {
        description: 'Fires when the visitor sends a message matching keywords.', parameters: [
            { key: 'keywords', label: 'Keywords', type: 'text', placeholder: 'hello, hi, help (comma-separated)', description: 'Comma-separated list of trigger words' },
            {
                key: 'match_type', label: 'Match type', type: 'select', options: [
                    { label: 'Contains any', value: 'contains' }, { label: 'Exact match', value: 'exact' }, { label: 'Regex', value: 'regex' }, { label: 'Match all (*)', value: 'any' },
                ], defaultValue: 'contains'
            },
        ], settings: COMMON_SETTINGS
    },
    new_event: {
        description: 'Fires on a custom JavaScript event.', parameters: [
            { key: 'event_name', label: 'Event name', type: 'text', placeholder: 'e.g. purchase_completed' },
        ], settings: COMMON_SETTINGS
    },
    form_abandoned: {
        description: 'Fires when the visitor leaves a form without submitting.', parameters: [
            { key: 'form_selector', label: 'Form CSS selector', type: 'text', placeholder: '#contact-form (optional)' },
        ], settings: COMMON_SETTINGS
    },
    mouse_leaves: { description: 'Exit-intent trigger — fires when the cursor leaves the browser window.', parameters: [], settings: COMMON_SETTINGS },
    idle_visitor: {
        description: 'Fires after the visitor is idle for a specified time.', parameters: [
            { key: 'idle_seconds', label: 'Idle time (seconds)', type: 'number', defaultValue: 30, min: 5, max: 600 },
        ], settings: COMMON_SETTINGS
    },
    schedule: {
        description: 'Time-based trigger that runs only on certain days and times.', parameters: [
            {
                key: 'days', label: 'Days of week', type: 'multiselect', options: [
                    { label: 'Mon', value: 'mon' }, { label: 'Tue', value: 'tue' }, { label: 'Wed', value: 'wed' },
                    { label: 'Thu', value: 'thu' }, { label: 'Fri', value: 'fri' }, { label: 'Sat', value: 'sat' }, { label: 'Sun', value: 'sun' },
                ]
            },
            { key: 'start_time', label: 'Start time', type: 'text', placeholder: '09:00' },
            { key: 'end_time', label: 'End time', type: 'text', placeholder: '17:00' },
            {
                key: 'timezone', label: 'Timezone', type: 'select', options: [
                    { label: 'IST (UTC+5:30)', value: 'Asia/Kolkata' }, { label: 'UTC', value: 'UTC' }, { label: 'EST', value: 'America/New_York' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    agent_no_respond: {
        description: 'Fires when a live agent does not respond within the timeout.', parameters: [
            { key: 'timeout_seconds', label: 'Timeout (seconds)', type: 'number', defaultValue: 30, min: 5, max: 300 },
        ], settings: COMMON_SETTINGS
    },
    agent_starts_flow: { description: 'Manual trigger — an agent starts this flow from the inbox.', parameters: [], settings: COMMON_SETTINGS },
    from_another_flow: {
        description: 'Chained trigger — another flow jumps into this one.', parameters: [
            { key: 'source_flow_id', label: 'Source flow', type: 'select', options: [], description: 'Select a flow (populated at runtime)' },
        ], settings: COMMON_SETTINGS
    },
    visitor_selects_dept: { description: 'Fires when the visitor selects a department in pre-chat.', parameters: [], settings: COMMON_SETTINGS },

    // === CONDITIONS ===
    based_on_variable: {
        description: 'Branch the flow based on a variable value.', parameters: [
            { key: 'variable_name', label: 'Variable', type: 'text', placeholder: 'e.g. email, name, cart_value' },
            {
                key: 'operator', label: 'Operator', type: 'select', options: [
                    { label: 'Equals', value: 'equals' }, { label: 'Not equals', value: 'not_equals' },
                    { label: 'Contains', value: 'contains' }, { label: 'Greater than', value: 'greater_than' },
                    { label: 'Less than', value: 'less_than' }, { label: 'Is set', value: 'is_set' }, { label: 'Is not set', value: 'is_not_set' },
                ]
            },
            { key: 'value', label: 'Value', type: 'text', placeholder: 'Comparison value' },
        ], settings: COMMON_SETTINGS
    },
    browser: {
        description: 'Branch by the visitor\'s browser.', parameters: [
            {
                key: 'browsers', label: 'Browsers', type: 'multiselect', options: [
                    { label: 'Chrome', value: 'chrome' }, { label: 'Firefox', value: 'firefox' }, { label: 'Safari', value: 'safari' }, { label: 'Edge', value: 'edge' }, { label: 'Other', value: 'other' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    operating_system: {
        description: 'Branch by the visitor\'s OS.', parameters: [
            {
                key: 'os_list', label: 'Operating Systems', type: 'multiselect', options: [
                    { label: 'Windows', value: 'windows' }, { label: 'macOS', value: 'macos' }, { label: 'Linux', value: 'linux' },
                    { label: 'Android', value: 'android' }, { label: 'iOS', value: 'ios' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    mobile: { description: 'Branch if the visitor is on a mobile device.', parameters: [], settings: COMMON_SETTINGS },
    returning_visitor: { description: 'Branch if this is a returning visitor.', parameters: [], settings: COMMON_SETTINGS },
    day: {
        description: 'Branch by the current day of the week.', parameters: [
            {
                key: 'days', label: 'Days', type: 'multiselect', options: [
                    { label: 'Mon', value: 'mon' }, { label: 'Tue', value: 'tue' }, { label: 'Wed', value: 'wed' },
                    { label: 'Thu', value: 'thu' }, { label: 'Fri', value: 'fri' }, { label: 'Sat', value: 'sat' }, { label: 'Sun', value: 'sun' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    current_url: {
        description: 'Branch based on the page the visitor is on.', parameters: [
            { key: 'url_pattern', label: 'URL pattern', type: 'text', placeholder: '/pricing or /product/*' },
            {
                key: 'match_type', label: 'Match type', type: 'select', options: [
                    { label: 'Contains', value: 'contains' }, { label: 'Exact', value: 'exact' }, { label: 'Regex', value: 'regex' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    language: {
        description: 'Branch by the visitor\'s browser language.', parameters: [
            {
                key: 'languages', label: 'Languages', type: 'multiselect', options: [
                    { label: 'English', value: 'en' }, { label: 'Hindi', value: 'hi' }, { label: 'Tamil', value: 'ta' },
                    { label: 'Telugu', value: 'te' }, { label: 'Kannada', value: 'kn' }, { label: 'Malayalam', value: 'ml' },
                    { label: 'Bengali', value: 'bn' }, { label: 'Marathi', value: 'mr' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    chat_status: {
        description: 'Branch by agent availability.', parameters: [
            {
                key: 'status', label: 'Status', type: 'select', options: [
                    { label: 'Online', value: 'online' }, { label: 'Offline', value: 'offline' }, { label: 'Busy', value: 'busy' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    mailing_subscriber: { description: 'Branch if the visitor is a mailing subscriber.', parameters: [], settings: COMMON_SETTINGS },
    connection_channel: {
        description: 'Branch by the communication channel.', parameters: [
            {
                key: 'channels', label: 'Channels', type: 'multiselect', options: [
                    { label: 'Live Chat', value: 'live_chat' }, { label: 'Email', value: 'email' },
                    { label: 'WhatsApp', value: 'whatsapp' }, { label: 'Instagram', value: 'instagram' }, { label: 'Messenger', value: 'messenger' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    cart_value: {
        description: 'Branch by the visitor\'s cart value (Shopify).', parameters: [
            {
                key: 'operator', label: 'Operator', type: 'select', options: [
                    { label: 'Greater than', value: 'greater_than' }, { label: 'Less than', value: 'less_than' }, { label: 'Equal to', value: 'equal' },
                ]
            },
            { key: 'value', label: 'Value (₹)', type: 'number', defaultValue: 500, min: 0 },
        ], settings: COMMON_SETTINGS
    },

    // === ACTIONS ===
    send_message: {
        description: 'Send a text message to the visitor in the chat.', howItWorks: 'The bot types and sends a message. Supports {{variable}} placeholders.', parameters: [
            { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Hello! How can I help you today?', description: 'Use {{name}}, {{email}} etc. for variables' },
            { key: 'typing_delay', label: 'Typing delay (ms)', type: 'number', defaultValue: 1000, min: 0, max: 5000, description: 'Simulated typing indicator time' },
        ], settings: COMMON_SETTINGS
    },
    ask_question: {
        description: 'Ask the visitor a question and store their reply in a variable.', parameters: [
            { key: 'question', label: 'Question text', type: 'textarea', placeholder: 'What is your email address?' },
            { key: 'variable_name', label: 'Save response as', type: 'text', placeholder: 'e.g. user_email' },
            {
                key: 'validation', label: 'Validate input', type: 'select', options: [
                    { label: 'None', value: 'none' }, { label: 'Email', value: 'email' }, { label: 'Phone', value: 'phone' }, { label: 'Number', value: 'number' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    decision_quick: {
        description: 'Show quick reply buttons that the visitor can click.', parameters: [
            { key: 'question', label: 'Question', type: 'textarea', placeholder: 'What are you looking for?' },
            { key: 'options', label: 'Options (one per line)', type: 'textarea', placeholder: 'Sales\nSupport\nBilling', description: 'Each line becomes a button. Each creates a separate output.' },
        ], settings: COMMON_SETTINGS
    },
    decision_buttons: {
        description: 'Show full-width button options.', parameters: [
            { key: 'question', label: 'Question', type: 'textarea', placeholder: 'Choose an option:' },
            { key: 'options', label: 'Buttons (one per line)', type: 'textarea', placeholder: 'View Pricing\nTalk to Sales\nGet Support' },
        ], settings: COMMON_SETTINGS
    },
    decision_cards: {
        description: 'Show a carousel of cards with images and CTAs.', parameters: [
            { key: 'cards', label: 'Cards (JSON array)', type: 'json', placeholder: '[{"title":"Product A","subtitle":"$99","button":"Buy Now"}]' },
        ], settings: COMMON_SETTINGS
    },
    send_email: {
        description: 'Send an email to the visitor or a team member.', parameters: [
            { key: 'to', label: 'To', type: 'text', placeholder: '{{user_email}} or team@company.com' },
            { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Thanks for reaching out!' },
            { key: 'body', label: 'Body (HTML)', type: 'textarea', placeholder: '<p>Hello {{name}},</p>' },
            { key: 'from_name', label: 'From name', type: 'text', placeholder: 'Support Team', defaultValue: 'Support' },
        ], settings: COMMON_SETTINGS
    },
    delay: {
        description: 'Wait before continuing to the next node.', parameters: [
            { key: 'duration', label: 'Duration', type: 'number', defaultValue: 5, min: 1 },
            {
                key: 'unit', label: 'Unit', type: 'select', options: [
                    { label: 'Seconds', value: 'seconds' }, { label: 'Minutes', value: 'minutes' }, { label: 'Hours', value: 'hours' },
                ], defaultValue: 'seconds'
            },
        ], settings: COMMON_SETTINGS
    },
    randomize: {
        description: 'A/B split traffic randomly into branches.', parameters: [
            { key: 'branches', label: 'Number of branches', type: 'number', defaultValue: 2, min: 2, max: 5 },
            { key: 'weights', label: 'Weights (comma-separated %)', type: 'text', placeholder: '50,50', description: 'Must add up to 100' },
        ], settings: COMMON_SETTINGS
    },
    api_call: {
        description: 'Make an HTTP request to any external API.', howItWorks: 'Sends an HTTP request and stores the response in a variable.', parameters: [
            { key: 'request_name', label: 'Request name', type: 'text', placeholder: 'Get user data' },
            {
                key: 'method', label: 'HTTP Method', type: 'select', options: [
                    { label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }, { label: 'PUT', value: 'PUT' }, { label: 'DELETE', value: 'DELETE' },
                ], defaultValue: 'GET'
            },
            { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/users/{{user_id}}' },
            {
                key: 'auth_type', label: 'Authentication', type: 'select', options: [
                    { label: 'None', value: 'none' }, { label: 'API Key', value: 'api_key' }, { label: 'Bearer token', value: 'bearer' }, { label: 'Basic', value: 'basic' },
                ], defaultValue: 'none'
            },
            { key: 'auth_value', label: 'API Key / Token', type: 'text', placeholder: 'Your API key' },
            { key: 'headers', label: 'Headers (JSON)', type: 'json', placeholder: '{"Content-Type": "application/json"}' },
            { key: 'body', label: 'Request body (JSON)', type: 'textarea', placeholder: '{"name": "{{user_name}}"}' },
            { key: 'response_variable', label: 'Save response as', type: 'text', defaultValue: 'api_response' },
        ], settings: COMMON_SETTINGS
    },
    update_contact: {
        description: 'Update a visitor property.', parameters: [
            {
                key: 'property', label: 'Property', type: 'select', options: [
                    { label: 'Name', value: 'name' }, { label: 'Email', value: 'email' }, { label: 'Phone', value: 'phone' }, { label: 'Company', value: 'company' }, { label: 'Custom', value: 'custom' },
                ]
            },
            { key: 'value', label: 'Value', type: 'text', placeholder: '{{user_name}} or static value' },
        ], settings: COMMON_SETTINGS
    },
    add_tag: {
        description: 'Add a tag to the visitor or conversation.', parameters: [
            { key: 'tag_name', label: 'Tag name', type: 'text', placeholder: 'e.g. hot-lead, vip' },
        ], settings: COMMON_SETTINGS
    },
    remove_tag: {
        description: 'Remove a tag.', parameters: [
            { key: 'tag_name', label: 'Tag name', type: 'text', placeholder: 'Tag to remove' },
        ], settings: COMMON_SETTINGS
    },
    update_session_var: {
        description: 'Set a custom session variable.', parameters: [
            { key: 'variable_name', label: 'Variable name', type: 'text', placeholder: 'e.g. user_intent' },
            { key: 'value', label: 'Value', type: 'text', placeholder: '{{expression}} or static value' },
        ], settings: COMMON_SETTINGS
    },
    data_transform: {
        description: 'Transform data using a JS expression.', parameters: [
            { key: 'input_variable', label: 'Input variable', type: 'text', placeholder: 'api_response' },
            { key: 'expression', label: 'Expression', type: 'textarea', placeholder: 'value.data.name.toUpperCase()', description: 'JS expression. Use "value" for input.' },
            { key: 'output_variable', label: 'Output variable', type: 'text', placeholder: 'transformed_data' },
        ], settings: COMMON_SETTINGS
    },
    send_zapier: {
        description: 'Send data to Zapier via webhook.', howItWorks: 'Sends the collected data to any other tool using Zapier. Requires Zapier integration.', parameters: [
            { key: 'zap_name', label: 'Zap name', type: 'text', placeholder: 'Type a name that best describes this action...' },
            { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.zapier.com/hooks/catch/...' },
            { key: 'payload', label: 'Payload (JSON)', type: 'json', placeholder: '{"email": "{{user_email}}"}' },
        ], settings: COMMON_SETTINGS
    },
    send_ga_event: {
        description: 'Fire a Google Analytics event.', parameters: [
            { key: 'event_name', label: 'Event name', type: 'text', placeholder: 'chat_started' },
            { key: 'event_params', label: 'Parameters (JSON)', type: 'json', placeholder: '{"category": "support"}' },
        ], settings: COMMON_SETTINGS
    },
    send_form: {
        description: 'Show a form to the visitor.', parameters: [
            { key: 'fields', label: 'Form fields (JSON)', type: 'json', placeholder: '[{"label":"Name","type":"text","required":true,"variable":"user_name"}]' },
        ], settings: COMMON_SETTINGS
    },
    assign_agent: {
        description: 'Route the conversation to a specific agent.', parameters: [
            { key: 'agent_id', label: 'Agent', type: 'select', options: [], description: 'Select agent (populated at runtime)' },
            {
                key: 'fallback', label: 'If agent offline', type: 'select', options: [
                    { label: 'Next available', value: 'next_available' }, { label: 'Queue', value: 'queue' }, { label: 'Show offline msg', value: 'offline_msg' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    reassign_dept: {
        description: 'Route to a department queue.', parameters: [
            { key: 'department', label: 'Department', type: 'select', options: [], description: 'Select department (populated at runtime)' },
            {
                key: 'priority', label: 'Priority', type: 'select', options: [
                    { label: 'Normal', value: 'normal' }, { label: 'High', value: 'high' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    disable_input: { description: 'Disable the text input — force the visitor to use buttons.', parameters: [], settings: COMMON_SETTINGS },
    enable_input: { description: 'Re-enable the text input.', parameters: [], settings: COMMON_SETTINGS },
    subscribe_mailing: {
        description: 'Subscribe the visitor to a mailing list.', parameters: [
            { key: 'list_name', label: 'List name', type: 'text', placeholder: 'Newsletter' },
            { key: 'consent_text', label: 'Consent text', type: 'text', placeholder: 'I agree to receive emails' },
        ], settings: COMMON_SETTINGS
    },
    send_notification: {
        description: 'Send a notification to agents.', parameters: [
            { key: 'notification_text', label: 'Message', type: 'textarea', placeholder: 'New lead from {{page_url}}' },
            {
                key: 'channel', label: 'Channel', type: 'select', options: [
                    { label: 'Browser', value: 'browser' }, { label: 'Email', value: 'email' }, { label: 'Slack', value: 'slack' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    to_another_flow: {
        description: 'Jump to a different flow.', parameters: [
            { key: 'target_flow_id', label: 'Target flow', type: 'select', options: [], description: 'Select flow (populated at runtime)' },
            { key: 'pass_variables', label: 'Pass variables', type: 'toggle', defaultValue: true },
        ], settings: COMMON_SETTINGS
    },
    flow_ended: {
        description: 'Show a message when the flow completes.', parameters: [
            { key: 'message', label: 'End message', type: 'textarea', placeholder: 'Thanks for chatting! Was this helpful?' },
            { key: 'show_survey', label: 'Show satisfaction survey', type: 'toggle', defaultValue: false },
        ], settings: COMMON_SETTINGS
    },
    open_website: {
        description: 'Open a URL in an iframe inside the chat.', parameters: [
            { key: 'url', label: 'URL', type: 'text', placeholder: 'https://calendly.com/your-link' },
            { key: 'width', label: 'Width (px)', type: 'number', defaultValue: 400 },
            { key: 'height', label: 'Height (px)', type: 'number', defaultValue: 500 },
            { key: 'title', label: 'Modal title', type: 'text', placeholder: 'Schedule a call' },
        ], settings: COMMON_SETTINGS
    },

    // === SHOPIFY ===
    shopify_order: {
        description: 'Look up order status by email or order number.', parameters: [
            {
                key: 'lookup_by', label: 'Look up by', type: 'select', options: [
                    { label: 'Email', value: 'email' }, { label: 'Order number', value: 'order_number' },
                ]
            },
            { key: 'value', label: 'Value', type: 'text', placeholder: '{{user_email}}' },
        ], settings: COMMON_SETTINGS
    },
    shopify_product: {
        description: 'Check product availability.', parameters: [
            { key: 'product_id', label: 'Product ID or name', type: 'text', placeholder: '{{product_name}}' },
            { key: 'variant', label: 'Variant (optional)', type: 'text', placeholder: 'e.g. Size: Large' },
        ], settings: COMMON_SETTINGS
    },
    shopify_shipping: {
        description: 'Get shipping details for an order.', parameters: [
            { key: 'order_id', label: 'Order ID', type: 'text', placeholder: '{{order_id}}' },
        ], settings: COMMON_SETTINGS
    },
    shopify_coupon: {
        description: 'Generate and send a discount code.', parameters: [
            {
                key: 'discount_type', label: 'Discount type', type: 'select', options: [
                    { label: 'Percentage (%)', value: 'percent' }, { label: 'Fixed amount (₹)', value: 'fixed' },
                ]
            },
            { key: 'amount', label: 'Amount', type: 'number', defaultValue: 10 },
            { key: 'min_order', label: 'Min order value (₹)', type: 'number', defaultValue: 0 },
            { key: 'expiry_days', label: 'Expires in (days)', type: 'number', defaultValue: 7 },
            { key: 'one_time', label: 'Single use only', type: 'toggle', defaultValue: true },
        ], settings: COMMON_SETTINGS
    },

    // === RAG / AI NODES ===
    doc_loader: {
        description: 'Load a document into the knowledge base.', parameters: [
            {
                key: 'source_type', label: 'Source type', type: 'select', options: [
                    { label: 'File upload', value: 'file' }, { label: 'URL', value: 'url' }, { label: 'Raw text', value: 'text' }, { label: 'API endpoint', value: 'api' },
                ]
            },
            { key: 'kb_id', label: 'Knowledge Base', type: 'select', options: [], description: 'Select a KB (populated at runtime)' },
        ], settings: COMMON_SETTINGS
    },
    text_splitter: {
        description: 'Split text into chunks for embedding.', parameters: [
            {
                key: 'strategy', label: 'Split strategy', type: 'select', options: [
                    { label: 'Fixed size', value: 'fixed_size' }, { label: 'By sentence', value: 'sentence' }, { label: 'By paragraph', value: 'paragraph' }, { label: 'Semantic', value: 'semantic' },
                ]
            },
            { key: 'chunk_size', label: 'Chunk size (tokens)', type: 'number', defaultValue: 512, min: 50, max: 8000 },
            { key: 'chunk_overlap', label: 'Overlap (tokens)', type: 'number', defaultValue: 50, min: 0, max: 500 },
        ], settings: COMMON_SETTINGS
    },
    embedding_model: {
        description: 'Select the embedding model.', parameters: [
            {
                key: 'model', label: 'Model', type: 'select', options: [
                    { label: 'text-embedding-3-small (OpenAI)', value: 'text-embedding-3-small' },
                    { label: 'text-embedding-3-large (OpenAI)', value: 'text-embedding-3-large' },
                    { label: 'embed-english-v3.0 (Cohere)', value: 'embed-english-v3.0' },
                ]
            },
            { key: 'dimensions', label: 'Dimensions', type: 'number', defaultValue: 1536 },
        ], settings: COMMON_SETTINGS
    },
    vector_store_writer: {
        description: 'Write embeddings to the vector database.', parameters: [
            { key: 'kb_id', label: 'Knowledge Base', type: 'select', options: [] },
            { key: 'batch_size', label: 'Batch size', type: 'number', defaultValue: 50 },
        ], settings: COMMON_SETTINGS
    },
    web_crawler: {
        description: 'Crawl a website and extract content.', parameters: [
            { key: 'start_url', label: 'Start URL', type: 'text', placeholder: 'https://docs.example.com' },
            { key: 'max_pages', label: 'Max pages', type: 'number', defaultValue: 50, min: 1, max: 500 },
            { key: 'max_depth', label: 'Max depth', type: 'number', defaultValue: 3, min: 1, max: 10 },
            { key: 'include_patterns', label: 'Include (regex)', type: 'text', placeholder: '/docs/*' },
            { key: 'exclude_patterns', label: 'Exclude (regex)', type: 'text', placeholder: '/blog/*' },
        ], settings: COMMON_SETTINGS
    },
    embed_query: {
        description: 'Convert the user\'s message into a vector for search.', parameters: [
            { key: 'input_variable', label: 'Input text variable', type: 'text', defaultValue: '{{message_text}}', description: 'Variable containing the text to embed' },
            {
                key: 'model', label: 'Embedding model', type: 'select', options: [
                    { label: 'text-embedding-3-small', value: 'text-embedding-3-small' },
                    { label: 'text-embedding-3-large', value: 'text-embedding-3-large' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    vector_search: {
        description: 'Search the knowledge base using vector similarity.', parameters: [
            { key: 'kb_id', label: 'Knowledge Base', type: 'select', options: [], description: 'Which KB to search' },
            { key: 'top_k', label: 'Top K results', type: 'number', defaultValue: 5, min: 1, max: 50 },
            { key: 'min_score', label: 'Min similarity score', type: 'slider', min: 0, max: 1, step: 0.05, defaultValue: 0.7 },
        ], settings: COMMON_SETTINGS
    },
    reranker: {
        description: 'Rerank search results using a cross-encoder model.', parameters: [
            {
                key: 'model', label: 'Reranker model', type: 'select', options: [
                    { label: 'Cohere rerank-v3.5', value: 'rerank-v3.5' }, { label: 'Cohere rerank-english-v3', value: 'rerank-english-v3' },
                ]
            },
            { key: 'top_n', label: 'Keep top N', type: 'number', defaultValue: 3, min: 1, max: 20 },
        ], settings: COMMON_SETTINGS
    },
    context_builder: {
        description: 'Format retrieved chunks into a context string for LLM.', parameters: [
            {
                key: 'format', label: 'Format', type: 'select', options: [
                    { label: 'Numbered (with citations)', value: 'numbered' }, { label: 'Plain text', value: 'plain' },
                ]
            },
            { key: 'max_tokens', label: 'Max context tokens', type: 'number', defaultValue: 2000, description: 'Truncate context beyond this limit' },
        ], settings: COMMON_SETTINGS
    },
    fallback_handler: {
        description: 'Check if search results exist — route to human if none.', parameters: [
            { key: 'score_threshold', label: 'Min results to pass', type: 'number', defaultValue: 1, min: 0 },
            {
                key: 'no_result_action', label: 'If no results', type: 'select', options: [
                    { label: 'Route to human agent', value: 'escalate' }, { label: 'Send fallback message', value: 'fallback_msg' }, { label: 'Try different KB', value: 'retry_kb' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    prompt_template: {
        description: 'Build the system prompt for the LLM with variable injection.', howItWorks: 'Constructs the system prompt and user message that will be sent to the LLM.', parameters: [
            { key: 'system_prompt', label: 'System message', type: 'textarea', placeholder: 'You are a helpful support agent. Answer based on the following context:\n\n{{context_string}}\n\nUser history: {{messages_array}}', description: 'Use {{variable}} to inject values' },
        ], settings: COMMON_SETTINGS
    },
    llm_call: {
        description: 'Call an LLM to generate a response.', howItWorks: 'Sends the prompt to the selected model and returns the generated text.', parameters: [
            {
                key: 'model', label: 'Model', type: 'select', options: [
                    { label: 'Sarvam-M (Sarvam AI)', value: 'sarvam-m' },
                    { label: 'GPT-4o (OpenAI)', value: 'gpt-4o' },
                    { label: 'GPT-4o-mini (OpenAI)', value: 'gpt-4o-mini' },
                    { label: 'Claude 3.5 Sonnet (Anthropic)', value: 'claude-3-5-sonnet-20241022' },
                ]
            },
            { key: 'temperature', label: 'Temperature', type: 'slider', min: 0, max: 2, step: 0.1, defaultValue: 0.3 },
            { key: 'max_tokens', label: 'Max tokens', type: 'number', defaultValue: 500, min: 50, max: 4096 },
            { key: 'require_output_format', label: 'Require specific output format', type: 'toggle', defaultValue: false },
        ], settings: COMMON_SETTINGS
    },
    chat_history_injector: {
        description: 'Inject recent chat history into the prompt.', parameters: [
            { key: 'max_turns', label: 'Max turns to include', type: 'number', defaultValue: 8, min: 1, max: 50 },
            {
                key: 'format', label: 'Format', type: 'select', options: [
                    { label: 'Messages array', value: 'messages' }, { label: 'Plain text', value: 'text' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    output_parser: {
        description: 'Parse and clean the LLM response.', parameters: [
            {
                key: 'format', label: 'Expected format', type: 'select', options: [
                    { label: 'Plain text', value: 'text' }, { label: 'JSON', value: 'json' }, { label: 'Regex extract', value: 'regex' },
                ]
            },
            { key: 'regex_pattern', label: 'Regex pattern (if regex)', type: 'text', placeholder: 'e.g. Order #(\\d+)' },
        ], settings: COMMON_SETTINGS
    },
    streaming_response: {
        description: 'Stream LLM output in real-time to the chat widget.', parameters: [
            { key: 'enabled', label: 'Enable streaming', type: 'toggle', defaultValue: true },
            { key: 'chunk_delay_ms', label: 'Chunk delay (ms)', type: 'number', defaultValue: 50, min: 0, max: 200 },
        ], settings: COMMON_SETTINGS
    },
    session_memory_read: {
        description: 'Read values from the session memory (Redis).', parameters: [
            { key: 'keys', label: 'Keys to read (comma-separated)', type: 'text', placeholder: 'user_intent, last_product' },
        ], settings: COMMON_SETTINGS
    },
    session_memory_write: {
        description: 'Write a value to session memory.', parameters: [
            { key: 'key', label: 'Key', type: 'text', placeholder: 'user_intent' },
            { key: 'value', label: 'Value', type: 'text', placeholder: '{{detected_intent}}' },
            { key: 'ttl_seconds', label: 'TTL (seconds)', type: 'number', defaultValue: 86400 },
        ], settings: COMMON_SETTINGS
    },
    longterm_memory_fetch: {
        description: 'Fetch past memories for this visitor.', parameters: [
            {
                key: 'memory_type', label: 'Memory type', type: 'select', options: [
                    { label: 'All', value: 'all' }, { label: 'Facts', value: 'fact' }, { label: 'Preferences', value: 'preference' }, { label: 'Summaries', value: 'summary' },
                ]
            },
            { key: 'top_k', label: 'Max memories', type: 'number', defaultValue: 5 },
        ], settings: COMMON_SETTINGS
    },
    longterm_memory_store: {
        description: 'Store a memory for future sessions.', parameters: [
            { key: 'content', label: 'Memory content', type: 'textarea', placeholder: '{{entity_data}}' },
            {
                key: 'memory_type', label: 'Type', type: 'select', options: [
                    { label: 'Fact', value: 'fact' }, { label: 'Preference', value: 'preference' }, { label: 'Summary', value: 'summary' }, { label: 'Profile', value: 'profile' },
                ]
            },
            { key: 'confidence', label: 'Confidence', type: 'slider', min: 0, max: 1, step: 0.1, defaultValue: 1.0 },
        ], settings: COMMON_SETTINGS
    },
    conversation_summarizer: {
        description: 'Summarize the conversation so far.', parameters: [
            { key: 'trigger_after_turns', label: 'Trigger after N turns', type: 'number', defaultValue: 15 },
            {
                key: 'summary_style', label: 'Style', type: 'select', options: [
                    { label: 'Bullet points', value: 'bullets' }, { label: 'Narrative', value: 'narrative' },
                ]
            },
        ], settings: COMMON_SETTINGS
    },
    entity_extractor: {
        description: 'Extract entities (names, emails, order numbers) from text.', parameters: [
            {
                key: 'entity_types', label: 'Entity types', type: 'multiselect', options: [
                    { label: 'Email', value: 'email' }, { label: 'Phone', value: 'phone' }, { label: 'Order number', value: 'order_number' },
                    { label: 'Product name', value: 'product' }, { label: 'Person name', value: 'person' }, { label: 'Date', value: 'date' },
                ]
            },
            { key: 'input_variable', label: 'Input variable', type: 'text', defaultValue: '{{message_text}}' },
        ], settings: COMMON_SETTINGS
    },
    ai_agent: {
        description: 'Autonomous AI agent with multi-step reasoning and tool use.', howItWorks: 'Uses a ReAct loop: Reason → Act → Observe, with access to tools you configure.', parameters: [
            {
                key: 'agent_type', label: 'Agent type', type: 'select', options: [
                    { label: 'ReAct (Reason + Act)', value: 'react' }, { label: 'Plan and Execute', value: 'plan_execute' },
                ]
            },
            {
                key: 'source_prompt', label: 'Source for Prompt (User Message)', type: 'select', options: [
                    { label: 'Connected Chat Trigger Node', value: 'trigger' }, { label: 'Define below', value: 'custom' },
                ]
            },
            { key: 'prompt', label: 'Prompt (User Message)', type: 'text', placeholder: '{{ $json.chatInput }}', description: 'The user message to process' },
            { key: 'require_output_format', label: 'Require Specific Output Format', type: 'toggle', defaultValue: false },
            { key: 'system_message', label: 'System Message', type: 'textarea', placeholder: '# General Instruction\nYou are a helpful AI agent...', description: 'Instructions for the agent' },
            { key: 'max_iterations', label: 'Max iterations', type: 'number', defaultValue: 10, min: 1, max: 50 },
        ], settings: [
            ...COMMON_SETTINGS,
            { key: 'max_auto_retries', label: 'Max auto retries', type: 'number', defaultValue: 3, min: 0, max: 10, description: 'This node will automatically retry if it fails' },
            { key: 'continue_on_fail', label: 'Continue on fail', type: 'toggle', defaultValue: true, description: 'Execution will continue even if the node fails' },
        ]
    },
    tool_node: {
        description: 'A tool the AI agent can use.', parameters: [
            {
                key: 'tool_type', label: 'Tool type', type: 'select', options: [
                    { label: 'Web search', value: 'web_search' }, { label: 'KB lookup', value: 'kb_lookup' }, { label: 'Calculator', value: 'calculator' }, { label: 'Custom API', value: 'custom' },
                ]
            },
            { key: 'tool_config', label: 'Tool config (JSON)', type: 'json', placeholder: '{}' },
        ], settings: COMMON_SETTINGS
    },
    code_interpreter: {
        description: 'Execute code in a sandboxed environment.', parameters: [
            {
                key: 'language', label: 'Language', type: 'select', options: [
                    { label: 'Python', value: 'python' }, { label: 'JavaScript', value: 'javascript' },
                ]
            },
            { key: 'code', label: 'Code', type: 'textarea', placeholder: 'result = input_data["value"] * 2' },
            { key: 'timeout_ms', label: 'Timeout (ms)', type: 'number', defaultValue: 5000 },
        ], settings: COMMON_SETTINGS
    },
    multi_agent_router: {
        description: 'Route to different AI agents based on the query.', parameters: [
            {
                key: 'routing_strategy', label: 'Routing strategy', type: 'select', options: [
                    { label: 'LLM-based (auto classify)', value: 'llm' }, { label: 'Rule-based (keywords)', value: 'rules' },
                ]
            },
            { key: 'agents', label: 'Agent configs (JSON)', type: 'json', placeholder: '[{"name":"Sales Agent","keywords":["pricing","buy"]}]' },
        ], settings: COMMON_SETTINGS
    },
};

// ===================================================================
// THE COMPONENT
// ===================================================================

interface NodeConfigPanelProps {
    node: any; // ReactFlow node
    onClose: () => void;
    onUpdateConfig: (nodeId: string, config: Record<string, any>) => void;
}

export function NodeConfigPanel({ node, onClose, onUpdateConfig }: NodeConfigPanelProps) {
    const [activeTab, setActiveTab] = useState<'parameters' | 'settings'>('parameters');
    const subtype = node?.data?.subtype || '';
    const nodeConfig = NODE_CONFIGS[subtype];

    if (!node || !nodeConfig) return null;

    const currentConfig = node.data.config || {};
    const fields = activeTab === 'parameters' ? nodeConfig.parameters : nodeConfig.settings;

    const handleFieldChange = (key: string, value: any) => {
        onUpdateConfig(node.id, { ...currentConfig, [key]: value });
    };

    return (
        <div className="w-[400px] bg-[#18181b] border-l border-white/10 h-full flex flex-col z-30 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1a1a22]">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-white truncate">{node.data.label}</span>
                    <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{subtype}</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            {/* Description */}
            <div className="px-4 py-3 border-b border-white/5">
                <p className="text-xs text-slate-400 leading-relaxed">{nodeConfig.description}</p>
                {nodeConfig.howItWorks && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-blue-400/80 bg-blue-500/5 border border-blue-500/10 rounded px-2 py-1.5">
                        <Info size={12} className="shrink-0 mt-0.5" />
                        <span>{nodeConfig.howItWorks}</span>
                    </div>
                )}
            </div>

            {/* Tabs: Parameters / Settings */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('parameters')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2
                        ${activeTab === 'parameters' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    <Sliders size={13} /> Parameters
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2
                        ${activeTab === 'settings' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    <Settings size={13} /> Settings
                </button>
            </div>

            {/* Fields */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {fields.length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-8">No configurable parameters for this node.</p>
                )}
                {fields.map((field) => (
                    <div key={field.key}>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">{field.label}</label>
                        {field.description && (
                            <p className="text-[10px] text-slate-500 mb-1.5">{field.description}</p>
                        )}

                        {/* TEXT */}
                        {field.type === 'text' && (
                            <input
                                type="text"
                                value={currentConfig[field.key] ?? field.defaultValue ?? ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        )}

                        {/* TEXTAREA */}
                        {field.type === 'textarea' && (
                            <>
                            <textarea
                                value={currentConfig[field.key] ?? field.defaultValue ?? ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                rows={4}
                                className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none transition-colors font-mono text-xs"
                            />
                            {/* WhatsApp 3-button limit warning */}
                            {(field.key === 'options') && (() => {
                                const val = currentConfig[field.key] ?? '';
                                const lineCount = val.split('\n').filter((l: string) => l.trim()).length;
                                if (lineCount > 3) {
                                    return (
                                        <div className="flex items-start gap-2 mt-1.5 p-2 bg-orange-500/5 border border-orange-500/20 rounded-md">
                                            <AlertTriangle size={12} className="text-orange-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-[11px] text-orange-400">WhatsApp limits Quick Reply buttons to 3. Extra buttons will be ignored on WhatsApp channels.</span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            </>
                        )}

                        {/* JSON */}
                        {field.type === 'json' && (
                            <textarea
                                value={currentConfig[field.key] ?? field.defaultValue ?? ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                rows={4}
                                className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-xs text-emerald-400 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none transition-colors font-mono"
                            />
                        )}

                        {/* NUMBER */}
                        {field.type === 'number' && (
                            <input
                                type="number"
                                value={currentConfig[field.key] ?? field.defaultValue ?? 0}
                                onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        )}

                        {/* SELECT */}
                        {field.type === 'select' && (
                            <select
                                value={currentConfig[field.key] ?? field.defaultValue ?? ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors appearance-none"
                            >
                                <option value="" className="bg-[#18181b]">— Select —</option>
                                {(field.options || []).map((opt) => (
                                    <option key={opt.value} value={opt.value} className="bg-[#18181b]">{opt.label}</option>
                                ))}
                            </select>
                        )}

                        {/* TOGGLE */}
                        {field.type === 'toggle' && (
                            <button
                                onClick={() => handleFieldChange(field.key, !(currentConfig[field.key] ?? field.defaultValue))}
                                className={`relative w-10 h-5 rounded-full transition-colors ${(currentConfig[field.key] ?? field.defaultValue) ? 'bg-blue-600' : 'bg-slate-700'
                                    }`}
                            >
                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${(currentConfig[field.key] ?? field.defaultValue) ? 'translate-x-5' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        )}

                        {/* SLIDER */}
                        {field.type === 'slider' && (
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    value={currentConfig[field.key] ?? field.defaultValue ?? field.min}
                                    onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                                    min={field.min}
                                    max={field.max}
                                    step={field.step}
                                    className="flex-1 accent-blue-500"
                                />
                                <span className="text-xs text-white font-mono w-10 text-right">
                                    {currentConfig[field.key] ?? field.defaultValue ?? field.min}
                                </span>
                            </div>
                        )}

                        {/* MULTISELECT */}
                        {field.type === 'multiselect' && (
                            <div className="flex flex-wrap gap-1.5">
                                {(field.options || []).map((opt) => {
                                    const selected = (currentConfig[field.key] || []).includes(opt.value);
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => {
                                                const current = currentConfig[field.key] || [];
                                                const updated = selected
                                                    ? current.filter((v: string) => v !== opt.value)
                                                    : [...current, opt.value];
                                                handleFieldChange(field.key, updated);
                                            }}
                                            className={`px-2 py-1 text-[11px] rounded border transition-colors ${selected
                                                    ? 'bg-blue-600 border-blue-500 text-white'
                                                    : 'bg-black/20 border-white/10 text-slate-400 hover:border-blue-500/40'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer with Execute button */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 bg-[#1a1a22]">
                <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-2 px-4 rounded-md transition-colors">
                    <Play size={12} /> Execute step
                </button>
            </div>
        </div>
    );
}
