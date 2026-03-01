/**
 * Antigravity Flow Templates Library — 32 RAG-Enhanced Templates
 * 
 * Every flow has silent RAG (Retrieval-Augmented Generation) running
 * in the background. The visitor never sees "searching..." — RAG
 * automatically pulls relevant context from the user's knowledge base
 * (scraped URLs, uploaded docs, FAQs) before delivering responses.
 * 
 * Categories: Sales (10), Leads (8), Support (14)
 * 
 * RAG behavior rules:
 * - RAG always runs silently — visitor never sees "searching..."
 * - RAG query auto-constructed from: visitor message + current page URL + last 3 turns
 * - Confidence >= 0.75 → use RAG answer to enrich response
 * - Confidence < 0.75  → use fallback message + offer human handoff
 * - RAG never overrides hardcoded discounts/coupons — only enriches product/policy descriptions
 * - Every response feels natural and conversational, NOT like a database lookup
 */

export interface FlowTemplate {
    name: string;
    description: string;
    category: 'sales' | 'leads' | 'support';
    trigger_type: string;
    is_active: boolean;
    uses?: number;
    tone_default?: 'friendly' | 'professional' | 'warm';
    rag_config?: {
        enabled: boolean;
        min_confidence: number;
        fallback_message: string;
        instruction?: string;
    };
    nodes: any[];
    edges: any[];
}

// Helper to generate nodes and edges
const node = (id: string, type: string, x: number, y: number, data: any) => ({
    id, type, position: { x, y }, data
});

const edge = (id: string, source: string, target: string) => ({
    id, source, target, type: 'custom'
});

// Silent RAG pipeline nodes — reused across templates  
const ragPipeline = (startY: number, instruction: string) => ({
    nodes: [
        node('rag-embed', 'flow_rag', 750, startY, { label: 'Embed Query', subtype: 'embed_query', category: 'retrieval', config: { input_variable: '{{message_text}}', silent: true } }),
        node('rag-search', 'flow_rag', 750, startY + 120, { label: 'Vector Search', subtype: 'vector_search', category: 'retrieval', config: { top_k: 5, min_score: 0.75, silent: true } }),
        node('rag-context', 'flow_rag', 750, startY + 240, { label: 'Context Builder', subtype: 'context_builder', category: 'retrieval', config: { format: 'numbered', instruction, silent: true } }),
        node('rag-llm', 'flow_rag', 750, startY + 360, { label: 'LLM Enrich', subtype: 'llm_call', category: 'llm', config: { model: 'sarvam', temperature: 0.7, silent: true, enrich_only: true } }),
    ],
    edges: [
        edge('rag-e1', 'rag-embed', 'rag-search'),
        edge('rag-e2', 'rag-search', 'rag-context'),
        edge('rag-e3', 'rag-context', 'rag-llm'),
    ]
});

export const flowTemplates: FlowTemplate[] = [

    // ═══════════════════════════════════════════════════════════════════
    // ██ SALES FLOWS (10)
    // ═══════════════════════════════════════════════════════════════════

    // ── 1. Cart Booster ──────────────────────────────────────────────
    {
        name: 'Cart Booster',
        description: 'Recover hesitant buyers with a timely nudge and product-aware assistance when they add items to cart.',
        category: 'sales',
        trigger_type: 'cart_add',
        is_active: false,
        uses: 82400,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'No worries! Feel free to chat with us if you have any questions.',
            instruction: 'Retrieve product benefits and reviews for items currently in cart'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Cart Add', subtype: 'cart_add', config: { delay_seconds: 30 } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Engage', subtype: 'send_message', config: { message: 'Hey! Great choice on those items. Need any help deciding?' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Decision', subtype: 'decision_buttons', config: { buttons: ['Tell me more about these', 'I have a question', 'Just browsing'] } }),
            node('cond-1', 'flow_condition', 400, 440, { label: 'Check Response', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'not_equals', value: 'Just browsing' } }),
            node('action-3', 'flow_action', 250, 560, { label: 'RAG Answer', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-4', 'flow_action', 250, 680, { label: 'Offer Help', subtype: 'send_message', config: { message: 'Anything else I can help with? Our team is here if you need us!' } }),
            node('action-5', 'flow_action', 550, 560, { label: 'Browse', subtype: 'send_message', config: { message: 'No problem! I\'m here if you need anything. Happy shopping!' } }),
            // Silent RAG pipeline
            ...ragPipeline(80, 'Retrieve product benefits and reviews for items currently in cart').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'cond-1'),
            edge('e5', 'cond-1', 'action-3'),
            edge('e6', 'action-3', 'action-4'),
            edge('e7', 'cond-1', 'action-5'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 2. Abandoned Cart Recovery ───────────────────────────────────
    {
        name: 'Abandoned Cart Recovery',
        description: 'Win back customers who left items in their cart with personalized product reminders and incentives.',
        category: 'sales',
        trigger_type: 'cart_abandoned',
        is_active: false,
        uses: 94600,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Your items are waiting! Let me know if I can help with anything.',
            instruction: 'Retrieve product details, shipping policy, and return policy for abandoned cart items'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Cart Abandoned', subtype: 'cart_abandoned', config: { delay_minutes: 15 } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Remind', subtype: 'send_message', config: { message: 'Hi! You left some great items in your cart. They\'re still waiting for you!' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Decision', subtype: 'decision_buttons', config: { buttons: ['Complete my order', 'I had a question', 'Not interested'] } }),
            node('cond-1', 'flow_condition', 400, 440, { label: 'Check Response', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'Complete my order' } }),
            node('action-3', 'flow_action', 200, 560, { label: 'Incentive', subtype: 'send_message', config: { message: 'Here\'s a little thank-you — use code COMEBACK10 for 10% off your order!' } }),
            node('action-4', 'flow_action', 200, 680, { label: 'CTA', subtype: 'send_message', config: { message: 'Head back to your cart to finish checkout. The code\'s already applied!' } }),
            node('action-5', 'flow_action', 400, 560, { label: 'Answer Question', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-6', 'flow_action', 400, 680, { label: 'Follow Up', subtype: 'send_message', config: { message: 'Does that help? Ready to complete your order?' } }),
            node('action-7', 'flow_action', 600, 560, { label: 'Close', subtype: 'send_message', config: { message: 'No problem at all! Your cart will be saved if you change your mind.' } }),
            ...ragPipeline(80, 'Retrieve product details, shipping info, and return policy for abandoned cart items').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'cond-1'),
            edge('e5', 'cond-1', 'action-3'),
            edge('e6', 'action-3', 'action-4'),
            edge('e7', 'cond-1', 'action-5'),
            edge('e8', 'action-5', 'action-6'),
            edge('e9', 'cond-1', 'action-7'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 3. Post-Purchase Upsell ──────────────────────────────────────
    {
        name: 'Post-Purchase Upsell',
        description: 'Suggest complementary products right after a purchase to increase average order value.',
        category: 'sales',
        trigger_type: 'purchase_complete',
        is_active: false,
        uses: 45200,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Thanks for your purchase! Let us know if you need anything.',
            instruction: 'Retrieve complementary products and accessories related to the purchased item'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Purchase Complete', subtype: 'purchase_complete' }),
            node('action-1', 'flow_action', 400, 200, { label: 'Thank', subtype: 'send_message', config: { message: 'Thanks for your order! Here\'s something you might love with it:' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Recommend', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Decision', subtype: 'decision_buttons', config: { buttons: ['Add to order', 'Tell me more', 'No thanks'] } }),
            node('cond-1', 'flow_condition', 400, 560, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'Add to order' } }),
            node('action-4', 'flow_action', 250, 680, { label: 'Added', subtype: 'send_message', config: { message: 'Great choice! We\'ve added it to your order. Enjoy!' } }),
            node('action-5', 'flow_action', 400, 680, { label: 'Details', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-6', 'flow_action', 550, 680, { label: 'Close', subtype: 'send_message', config: { message: 'No worries! Your order is on its way. Thanks again!' } }),
            ...ragPipeline(80, 'Retrieve complementary products and accessories related to the purchased item').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'cond-1'),
            edge('e6', 'cond-1', 'action-4'),
            edge('e7', 'cond-1', 'action-5'),
            edge('e8', 'cond-1', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 4. Discount for New Visitors ─────────────────────────────────
    {
        name: 'Discount for New Visitors',
        description: 'Welcome first-time visitors with a personalized discount to encourage their first purchase.',
        category: 'sales',
        trigger_type: 'first_visit',
        is_active: false,
        uses: 66200,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Welcome! Use code WELCOME15 for 15% off your first order.',
            instruction: 'Retrieve current promotions, bestsellers, and new arrivals relevant to the landing page'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'First Visit', subtype: 'first_visit', config: { delay_seconds: 10 } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Welcome', subtype: 'send_message', config: { message: 'Welcome! First time here? Here\'s 15% off your first order — code: WELCOME15' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Browse Help', subtype: 'send_message', config: { message: 'Looking for something specific? I can help you find the perfect match.' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Decision', subtype: 'decision_buttons', config: { buttons: ['Show me bestsellers', 'I need help choosing', 'Just browsing'] } }),
            node('cond-1', 'flow_condition', 400, 560, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'not_equals', value: 'Just browsing' } }),
            node('action-4', 'flow_action', 300, 680, { label: 'Personalized', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-5', 'flow_action', 300, 800, { label: 'Remind Code', subtype: 'send_message', config: { message: 'Don\'t forget — WELCOME15 gets you 15% off! Valid for the next 48 hours.' } }),
            node('action-6', 'flow_action', 550, 680, { label: 'Browse', subtype: 'send_message', config: { message: 'Enjoy exploring! Your code WELCOME15 will be here when you\'re ready.' } }),
            ...ragPipeline(80, 'Retrieve bestselling products, current promotions, and popular categories').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'cond-1'),
            edge('e6', 'cond-1', 'action-4'),
            edge('e7', 'action-4', 'action-5'),
            edge('e8', 'cond-1', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 5. Spinning Wheel Coupon ─────────────────────────────────────
    {
        name: 'Spinning Wheel Coupon',
        description: 'Gamify the shopping experience with a spin-to-win coupon wheel that captures emails.',
        category: 'sales',
        trigger_type: 'first_visit',
        is_active: false,
        uses: 38700,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Congrats! Use your code at checkout.',
            instruction: 'Retrieve active coupon terms, product categories, and minimum order values'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'First Visit', subtype: 'first_visit', config: { delay_seconds: 15 } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Hook', subtype: 'send_message', config: { message: 'Feeling lucky? Spin the wheel to win a discount!' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Email Gate', subtype: 'ask_question', config: { question: 'Enter your email to spin:', variable: 'visitor_email' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Spin Result', subtype: 'send_message', config: { message: 'You won 20% off! Use code: SPIN20 at checkout.' } }),
            node('action-4', 'flow_action', 400, 560, { label: 'Product Tip', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-5', 'flow_action', 400, 680, { label: 'CTA', subtype: 'send_message', config: { message: 'Your code is valid for 24 hours. Happy shopping!' } }),
            ...ragPipeline(80, 'Retrieve trending products and popular categories to suggest after coupon win').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'action-4'),
            edge('e6', 'action-4', 'action-5'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 6. Last Items in Stock Alert ─────────────────────────────────
    {
        name: 'Last Items in Stock Alert',
        description: 'Create urgency by alerting visitors when products they\'re viewing are low in stock.',
        category: 'sales',
        trigger_type: 'page_visit',
        is_active: false,
        uses: 29100,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'This item is selling fast! Grab it before it\'s gone.',
            instruction: 'Retrieve stock levels, product popularity metrics, and similar available alternatives'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Product Page', subtype: 'page_visit', config: { url_contains: '/product' } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Alert', subtype: 'send_message', config: { message: 'Heads up — this item is almost sold out! Only a few left in stock.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Details', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Decision', subtype: 'decision_buttons', config: { buttons: ['Add to cart', 'Notify when back', 'Show alternatives'] } }),
            node('cond-1', 'flow_condition', 400, 560, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'Notify when back' } }),
            node('action-4', 'flow_action', 250, 680, { label: 'Notify Email', subtype: 'ask_question', config: { question: 'Enter your email — we\'ll notify you the moment it\'s back:', variable: 'visitor_email' } }),
            node('action-5', 'flow_action', 250, 800, { label: 'Confirmed', subtype: 'send_message', config: { message: 'You\'re on the list! We\'ll email you as soon as it\'s restocked.' } }),
            node('action-6', 'flow_action', 550, 680, { label: 'Alternatives', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            ...ragPipeline(80, 'Retrieve stock levels, product details, and similar available products').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'cond-1'),
            edge('e6', 'cond-1', 'action-4'),
            edge('e7', 'action-4', 'action-5'),
            edge('e8', 'cond-1', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 7. Smart Product Recommender ─────────────────────────────────
    {
        name: 'Smart Product Recommender',
        description: 'Ask a few questions, then use AI to recommend the perfect product from your knowledge base.',
        category: 'sales',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 52300,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'I\'d love to help! Let me connect you with a team member who can find the perfect match.',
            instruction: 'Retrieve products matching visitor preferences, budget, and use case from catalog'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Says', subtype: 'visitor_says', config: { keywords: ['recommend', 'suggest', 'best', 'which', 'help me choose'] } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Start', subtype: 'send_message', config: { message: 'I\'d love to help you find the right fit! Let me ask a couple quick questions.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Use Case', subtype: 'ask_question', config: { question: 'What will you mainly use it for?', variable: 'use_case' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Budget', subtype: 'ask_question', config: { question: 'What\'s your budget range?', variable: 'budget' } }),
            node('action-4', 'flow_action', 400, 560, { label: 'Preferences', subtype: 'ask_question', config: { question: 'Any must-haves or preferences?', variable: 'preferences' } }),
            node('action-5', 'flow_action', 400, 680, { label: 'Recommendation', subtype: 'send_message', config: { message: 'Based on what you told me, here\'s what I\'d recommend:\n\n{{rag_response}}' } }),
            node('action-6', 'flow_action', 400, 800, { label: 'Follow Up', subtype: 'decision_buttons', config: { buttons: ['Sounds great!', 'Show me more options', 'Talk to a person'] } }),
            ...ragPipeline(80, 'Retrieve products matching visitor use case, budget, and preferences from product catalog').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'action-4'),
            edge('e6', 'action-4', 'action-5'),
            edge('e7', 'action-5', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 8. Inform About Active Discounts ─────────────────────────────
    {
        name: 'Inform About Active Discounts',
        description: 'Proactively tell visitors about ongoing promotions and sales relevant to what they\'re browsing.',
        category: 'sales',
        trigger_type: 'page_visit',
        is_active: false,
        uses: 41800,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Check out our Offers page for the latest deals!',
            instruction: 'Retrieve all active discount campaigns, promo codes, and sale categories'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Page Visit', subtype: 'page_visit', config: { delay_seconds: 8 } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Promo Alert', subtype: 'send_message', config: { message: 'Hey! Just so you know, we have some great deals running right now:' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Deals', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'CTA', subtype: 'decision_buttons', config: { buttons: ['Show me deals', 'Any codes for me?', 'No thanks'] } }),
            node('cond-1', 'flow_condition', 400, 560, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'not_equals', value: 'No thanks' } }),
            node('action-4', 'flow_action', 300, 680, { label: 'Details', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-5', 'flow_action', 550, 680, { label: 'Close', subtype: 'send_message', config: { message: 'No worries! Deals are on our site anytime you want to check.' } }),
            ...ragPipeline(80, 'Retrieve active promotions, discount codes, sale categories, and deal terms').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'cond-1'),
            edge('e6', 'cond-1', 'action-4'),
            edge('e7', 'cond-1', 'action-5'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 9. Free Shipping Threshold Nudge ─────────────────────────────
    {
        name: 'Free Shipping Threshold Nudge',
        description: 'Encourage visitors to add more items by showing how close they are to free shipping.',
        category: 'sales',
        trigger_type: 'cart_add',
        is_active: false,
        uses: 35600,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Add a bit more to your cart to unlock free shipping!',
            instruction: 'Retrieve free shipping threshold, popular add-on items under the remaining amount'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Cart Add', subtype: 'cart_add' }),
            node('action-1', 'flow_action', 400, 200, { label: 'Nudge', subtype: 'send_message', config: { message: 'You\'re so close to free shipping! Add just a little more to your cart.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Suggestions', subtype: 'send_message', config: { message: 'Here are some popular picks that\'d get you there:\n\n{{rag_response}}' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Decision', subtype: 'decision_buttons', config: { buttons: ['Show me more', 'Proceed to checkout', 'No thanks'] } }),
            node('cond-1', 'flow_condition', 400, 560, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'Show me more' } }),
            node('action-4', 'flow_action', 300, 680, { label: 'More Items', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-5', 'flow_action', 550, 680, { label: 'Checkout', subtype: 'send_message', config: { message: 'Happy shopping! Head to checkout whenever you\'re ready.' } }),
            ...ragPipeline(80, 'Retrieve products under $20 that complement items in cart, and free shipping policy').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'cond-1'),
            edge('e6', 'cond-1', 'action-4'),
            edge('e7', 'cond-1', 'action-5'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 10. Proactive Welcome Message ────────────────────────────────
    {
        name: 'Proactive Welcome Message',
        description: 'Greet every visitor with a smart, context-aware welcome based on the page they landed on.',
        category: 'sales',
        trigger_type: 'first_visit',
        is_active: true,
        uses: 120000,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Welcome! How can I help you today?',
            instruction: 'Retrieve business description, top offerings, and current promotions for landing page context'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'First Visit', subtype: 'first_visit', config: { delay_seconds: 5 } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Welcome', subtype: 'send_message', config: { message: 'Hi there! Welcome. How can I help you today?' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Quick Options', subtype: 'decision_buttons', config: { buttons: ['Browse products', 'I have a question', 'Talk to support'] } }),
            node('cond-1', 'flow_condition', 400, 440, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'I have a question' } }),
            node('action-3', 'flow_action', 250, 560, { label: 'RAG Answer', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-4', 'flow_action', 500, 560, { label: 'Handoff', subtype: 'send_message', config: { message: 'Let me connect you with our team right away!' } }),
            ...ragPipeline(80, 'Retrieve business overview, current page context, and popular FAQs').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'cond-1'),
            edge('e5', 'cond-1', 'action-3'),
            edge('e6', 'cond-1', 'action-4'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // ██ LEADS FLOWS (8)
    // ═══════════════════════════════════════════════════════════════════

    // ── 1. Lead Generation Bot ───────────────────────────────────────
    {
        name: 'Lead Generation Bot',
        description: 'Engage visitors and capture their contact information with smart, context-aware conversation.',
        category: 'leads',
        trigger_type: 'visitor_clicks_chat',
        is_active: false,
        uses: 94600,
        tone_default: 'professional',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Thanks for your interest! Our team will be in touch shortly.',
            instruction: 'Retrieve service descriptions and value propositions to personalize lead capture conversation'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Clicks Chat', subtype: 'visitor_clicks_chat' }),
            node('action-1', 'flow_action', 400, 200, { label: 'Welcome', subtype: 'send_message', config: { message: 'Hi there! I\'m here to help you get started. What brings you here today?' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Interest', subtype: 'decision_buttons', config: { buttons: ['Learn about your product', 'Get pricing', 'Talk to sales', 'Just browsing'] } }),
            node('cond-1', 'flow_condition', 400, 440, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'not_equals', value: 'Just browsing' } }),
            node('action-3', 'flow_action', 300, 560, { label: 'Context', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-4', 'flow_action', 300, 680, { label: 'Ask Name', subtype: 'ask_question', config: { question: 'What\'s your name?', variable: 'visitor_name' } }),
            node('action-5', 'flow_action', 300, 800, { label: 'Ask Email', subtype: 'ask_question', config: { question: 'And your best email, {{visitor_name}}?', variable: 'visitor_email' } }),
            node('action-6', 'flow_action', 300, 920, { label: 'Ask Phone', subtype: 'ask_question', config: { question: 'Phone number? (optional — for faster follow-up)', variable: 'visitor_phone' } }),
            node('action-7', 'flow_action', 300, 1040, { label: 'Thanks', subtype: 'send_message', config: { message: 'Perfect, {{visitor_name}}! Our team will reach out shortly. Anything else I can help with?' } }),
            node('action-8', 'flow_action', 550, 560, { label: 'Browse', subtype: 'send_message', config: { message: 'No problem! Take your time. I\'m here if you need anything.' } }),
            ...ragPipeline(80, 'Retrieve product/service overview and value propositions for lead qualification').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'cond-1'),
            edge('e5', 'cond-1', 'action-3'),
            edge('e6', 'action-3', 'action-4'),
            edge('e7', 'action-4', 'action-5'),
            edge('e8', 'action-5', 'action-6'),
            edge('e9', 'action-6', 'action-7'),
            edge('e10', 'cond-1', 'action-8'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 2. Exit Intent Email Capture ─────────────────────────────────
    {
        name: 'Exit Intent Email Capture',
        description: 'Capture emails from visitors about to leave with a compelling, context-aware offer.',
        category: 'leads',
        trigger_type: 'exit_intent',
        is_active: false,
        uses: 58300,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Before you go — get 10% off by joining our list!',
            instruction: 'Retrieve the most relevant offer or content based on pages the visitor viewed'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Exit Intent', subtype: 'exit_intent' }),
            node('action-1', 'flow_action', 400, 200, { label: 'Catch', subtype: 'send_message', config: { message: 'Wait! Before you go — don\'t miss out on something special.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Offer', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Email', subtype: 'ask_question', config: { question: 'Drop your email to get exclusive access:', variable: 'visitor_email' } }),
            node('action-4', 'flow_action', 400, 560, { label: 'Confirm', subtype: 'send_message', config: { message: 'You\'re in! Check your inbox for something special.' } }),
            ...ragPipeline(80, 'Retrieve best offer, discount, or content piece relevant to pages visitor browsed').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'action-4'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 3. Newsletter Signup ─────────────────────────────────────────
    {
        name: 'Newsletter Signup',
        description: 'Grow your email list by offering valuable content previews powered by your knowledge base.',
        category: 'leads',
        trigger_type: 'page_visit',
        is_active: false,
        uses: 42100,
        tone_default: 'professional',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Join our newsletter for the latest updates and exclusive content!',
            instruction: 'Retrieve recent blog posts, guides, or content previews to entice newsletter signup'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Blog Visit', subtype: 'page_visit', config: { url_contains: '/blog', delay_seconds: 20 } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Content Tease', subtype: 'send_message', config: { message: 'Enjoying our content? Get the best articles delivered to your inbox weekly.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Preview', subtype: 'send_message', config: { message: 'Here\'s what subscribers got last week:\n\n{{rag_response}}' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Decision', subtype: 'decision_buttons', config: { buttons: ['Subscribe me!', 'Maybe later'] } }),
            node('cond-1', 'flow_condition', 400, 560, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'Subscribe me!' } }),
            node('action-4', 'flow_action', 300, 680, { label: 'Email', subtype: 'ask_question', config: { question: 'What\'s your email?', variable: 'visitor_email' } }),
            node('action-5', 'flow_action', 300, 800, { label: 'Done', subtype: 'send_message', config: { message: 'You\'re subscribed! Welcome aboard. Check your inbox soon.' } }),
            node('action-6', 'flow_action', 550, 680, { label: 'Later', subtype: 'send_message', config: { message: 'No rush! The option is always here. Enjoy reading!' } }),
            ...ragPipeline(80, 'Retrieve recent published content, article titles, and newsletter preview highlights').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'cond-1'),
            edge('e6', 'cond-1', 'action-4'),
            edge('e7', 'action-4', 'action-5'),
            edge('e8', 'cond-1', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 4. Industry-Specific Lead Gen (Beauty / Wellness) ────────────
    {
        name: 'Beauty & Wellness Lead Gen',
        description: 'Capture beauty and wellness leads with personalized consultations powered by your product knowledge.',
        category: 'leads',
        trigger_type: 'visitor_clicks_chat',
        is_active: false,
        uses: 18200,
        tone_default: 'warm',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'We\'d love to help! Our team will follow up with personalized recommendations.',
            instruction: 'Retrieve product recommendations based on skin type, concerns, and beauty goals'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Chat Click', subtype: 'visitor_clicks_chat' }),
            node('action-1', 'flow_action', 400, 200, { label: 'Welcome', subtype: 'send_message', config: { message: 'Welcome! Looking for personalized beauty or wellness advice? I\'m here to help.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Interest', subtype: 'decision_buttons', config: { buttons: ['Skincare', 'Haircare', 'Wellness', 'Book consultation'] } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Concerns', subtype: 'ask_question', config: { question: 'What\'s your main concern or goal?', variable: 'concern' } }),
            node('action-4', 'flow_action', 400, 560, { label: 'Recommendation', subtype: 'send_message', config: { message: 'Based on your needs, here\'s what I\'d suggest:\n\n{{rag_response}}' } }),
            node('action-5', 'flow_action', 400, 680, { label: 'Capture', subtype: 'ask_question', config: { question: 'Want personalized tips sent to your inbox? Drop your email:', variable: 'visitor_email' } }),
            node('action-6', 'flow_action', 400, 800, { label: 'Name', subtype: 'ask_question', config: { question: 'And your name?', variable: 'visitor_name' } }),
            node('action-7', 'flow_action', 400, 920, { label: 'Done', subtype: 'send_message', config: { message: 'Thanks, {{visitor_name}}! We\'ll send you tailored recommendations. Take care!' } }),
            ...ragPipeline(80, 'Retrieve beauty/wellness products matching concern type, skin type, and goals').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'action-4'),
            edge('e6', 'action-4', 'action-5'),
            edge('e7', 'action-5', 'action-6'),
            edge('e8', 'action-6', 'action-7'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 5. Qualify Leads with Questions ───────────────────────────────
    {
        name: 'Qualify Leads with Questions',
        description: 'Score and qualify leads by asking strategic questions, then route them to the right team.',
        category: 'leads',
        trigger_type: 'visitor_clicks_chat',
        is_active: false,
        uses: 31400,
        tone_default: 'professional',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Thanks for the details! Our team will review and get back to you.',
            instruction: 'Retrieve service tiers, pricing info, and case studies matching lead profile'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Chat Click', subtype: 'visitor_clicks_chat' }),
            node('action-1', 'flow_action', 400, 200, { label: 'Start', subtype: 'send_message', config: { message: 'Hi! Let me learn a bit about you so I can connect you with the right person.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Company Size', subtype: 'decision_buttons', config: { buttons: ['1-10 employees', '11-50', '51-200', '200+'] } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Role', subtype: 'ask_question', config: { question: 'What\'s your role?', variable: 'role' } }),
            node('action-4', 'flow_action', 400, 560, { label: 'Need', subtype: 'ask_question', config: { question: 'What challenge are you trying to solve?', variable: 'challenge' } }),
            node('action-5', 'flow_action', 400, 680, { label: 'Timeline', subtype: 'decision_buttons', config: { buttons: ['This week', 'This month', 'This quarter', 'Just exploring'] } }),
            node('action-6', 'flow_action', 400, 800, { label: 'Tailored', subtype: 'send_message', config: { message: 'Based on what you\'ve shared:\n\n{{rag_response}}' } }),
            node('action-7', 'flow_action', 400, 920, { label: 'Email', subtype: 'ask_question', config: { question: 'What\'s the best email to reach you?', variable: 'visitor_email' } }),
            node('action-8', 'flow_action', 400, 1040, { label: 'Done', subtype: 'send_message', config: { message: 'We\'ll be in touch within 24 hours with a tailored proposal. Thanks!' } }),
            ...ragPipeline(80, 'Retrieve matching service tier, case studies, and pricing for lead profile').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'action-4'),
            edge('e6', 'action-4', 'action-5'),
            edge('e7', 'action-5', 'action-6'),
            edge('e8', 'action-6', 'action-7'),
            edge('e9', 'action-7', 'action-8'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 6. Reactive Welcome Message ──────────────────────────────────
    {
        name: 'Reactive Welcome Message',
        description: 'Respond to returning visitors with a personalized greeting based on their browsing history.',
        category: 'leads',
        trigger_type: 'returning_visitor',
        is_active: false,
        uses: 27600,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Welcome back! Let us know how we can help.',
            instruction: 'Retrieve new content, product updates, or offers since the visitor last visited'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Returning Visitor', subtype: 'returning_visitor' }),
            node('action-1', 'flow_action', 400, 200, { label: 'Welcome Back', subtype: 'send_message', config: { message: 'Welcome back! Great to see you again.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Updates', subtype: 'send_message', config: { message: 'Here\'s what\'s new since your last visit:\n\n{{rag_response}}' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Options', subtype: 'decision_buttons', config: { buttons: ['Pick up where I left off', 'Show me what\'s new', 'I need help'] } }),
            node('cond-1', 'flow_condition', 400, 560, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'I need help' } }),
            node('action-4', 'flow_action', 300, 680, { label: 'Help', subtype: 'ask_question', config: { question: 'Sure! What can I help you with?', variable: 'help_topic' } }),
            node('action-5', 'flow_action', 300, 800, { label: 'Answer', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-6', 'flow_action', 550, 680, { label: 'Browse', subtype: 'send_message', config: { message: 'Enjoy exploring! I\'m here if you need anything.' } }),
            ...ragPipeline(80, 'Retrieve new products, updates, and offers since visitor last session').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'cond-1'),
            edge('e6', 'cond-1', 'action-4'),
            edge('e7', 'action-4', 'action-5'),
            edge('e8', 'cond-1', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 7. Multilingual Greeting + Lead Capture ──────────────────────
    {
        name: 'Multilingual Greeting + Lead Capture',
        description: 'Greet visitors in their preferred language and capture leads with localized conversation.',
        category: 'leads',
        trigger_type: 'first_visit',
        is_active: false,
        uses: 15800,
        tone_default: 'warm',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Thanks for visiting! We\'ll follow up in your preferred language.',
            instruction: 'Retrieve localized content and FAQs based on detected visitor language'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'First Visit', subtype: 'first_visit' }),
            node('action-1', 'flow_action', 400, 200, { label: 'Language', subtype: 'send_message', config: { message: 'Hello! Choose your language / Elige tu idioma / Choisissez votre langue:' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Pick Language', subtype: 'decision_buttons', config: { buttons: ['English', 'Español', 'Français', 'Deutsch', 'Hindi'] } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Localized Welcome', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-4', 'flow_action', 400, 560, { label: 'Ask Name', subtype: 'ask_question', config: { question: 'What\'s your name?', variable: 'visitor_name' } }),
            node('action-5', 'flow_action', 400, 680, { label: 'Ask Email', subtype: 'ask_question', config: { question: 'And your email?', variable: 'visitor_email' } }),
            node('action-6', 'flow_action', 400, 800, { label: 'Done', subtype: 'send_message', config: { message: 'Thanks, {{visitor_name}}! We\'ll follow up in your preferred language.' } }),
            ...ragPipeline(80, 'Retrieve localized welcome message, FAQs, and business info in detected language').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'action-4'),
            edge('e6', 'action-4', 'action-5'),
            edge('e7', 'action-5', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 8. Weekend / Offline Lead Capture ────────────────────────────
    {
        name: 'Weekend / Offline Lead Capture',
        description: 'Capture leads outside business hours with helpful info and a promise to follow up.',
        category: 'leads',
        trigger_type: 'visitor_clicks_chat',
        is_active: false,
        uses: 22400,
        tone_default: 'warm',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'We\'re offline right now but will get back to you first thing!',
            instruction: 'Retrieve business hours, FAQs, and self-service resources for offline visitors'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Chat Click', subtype: 'visitor_clicks_chat', config: { conditions: { business_hours: false } } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Offline Notice', subtype: 'send_message', config: { message: 'Hi! We\'re currently offline, but I can still help you with common questions.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Decision', subtype: 'decision_buttons', config: { buttons: ['I have a question', 'Leave a message', 'When are you open?'] } }),
            node('cond-1', 'flow_condition', 400, 440, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'I have a question' } }),
            node('action-3', 'flow_action', 200, 560, { label: 'Ask Question', subtype: 'ask_question', config: { question: 'Go ahead — I\'ll check our knowledge base:', variable: 'question' } }),
            node('action-4', 'flow_action', 200, 680, { label: 'RAG Answer', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-5', 'flow_action', 200, 800, { label: 'Email Capture', subtype: 'ask_question', config: { question: 'Want a human follow-up when we\'re back? Leave your email:', variable: 'visitor_email' } }),
            node('action-6', 'flow_action', 200, 920, { label: 'Done', subtype: 'send_message', config: { message: 'Got it! We\'ll reach out first thing. Have a great day!' } }),
            node('action-7', 'flow_action', 400, 560, { label: 'Message', subtype: 'ask_question', config: { question: 'Leave your message and email — we\'ll respond ASAP:', variable: 'offline_message' } }),
            node('action-8', 'flow_action', 600, 560, { label: 'Hours', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            ...ragPipeline(80, 'Retrieve business hours, common FAQs, and self-service help articles').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'cond-1'),
            edge('e5', 'cond-1', 'action-3'),
            edge('e6', 'action-3', 'action-4'),
            edge('e7', 'action-4', 'action-5'),
            edge('e8', 'action-5', 'action-6'),
            edge('e9', 'cond-1', 'action-7'),
            edge('e10', 'cond-1', 'action-8'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // ██ SUPPORT FLOWS (14)
    // ═══════════════════════════════════════════════════════════════════

    // ── 1. RAG-Powered FAQ Bot ───────────────────────────────────────
    {
        name: 'RAG-Powered FAQ Bot',
        description: 'Instantly answer any question using AI-powered retrieval from your entire knowledge base.',
        category: 'support',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 156000,
        tone_default: 'professional',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'I\'m not sure about that. Let me connect you with someone who can help.',
            instruction: 'Retrieve the most relevant FAQ answer from the full knowledge base'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Says', subtype: 'visitor_says' }),
            node('rag-1', 'flow_rag', 400, 200, { label: 'Embed Query', subtype: 'embed_query', category: 'retrieval', config: { input_variable: '{{message_text}}' } }),
            node('rag-2', 'flow_rag', 400, 320, { label: 'Vector Search', subtype: 'vector_search', category: 'retrieval', config: { top_k: 5, min_score: 0.75 } }),
            node('rag-3', 'flow_rag', 400, 440, { label: 'Context Builder', subtype: 'context_builder', category: 'retrieval', config: { format: 'numbered' } }),
            node('rag-4', 'flow_rag', 400, 560, { label: 'LLM Call', subtype: 'llm_call', category: 'llm', config: { model: 'sarvam', temperature: 0.7 } }),
            node('cond-1', 'flow_condition', 400, 680, { label: 'Confidence Check', subtype: 'based_on_variable', config: { variable: 'rag_confidence', operator: 'gte', value: '0.75' } }),
            node('action-1', 'flow_action', 250, 800, { label: 'Send Answer', subtype: 'send_message', config: { message: '{{llm_response}}' } }),
            node('action-2', 'flow_action', 250, 920, { label: 'Helpful?', subtype: 'decision_buttons', config: { buttons: ['Yes, thanks!', 'I have another question', 'Talk to a person'] } }),
            node('action-3', 'flow_action', 550, 800, { label: 'Handoff', subtype: 'send_message', config: { message: 'I\'m not confident I have the right answer. Let me connect you with a team member who can help right away.' } }),
        ],
        edges: [
            edge('e1', 'trigger-1', 'rag-1'),
            edge('e2', 'rag-1', 'rag-2'),
            edge('e3', 'rag-2', 'rag-3'),
            edge('e4', 'rag-3', 'rag-4'),
            edge('e5', 'rag-4', 'cond-1'),
            edge('e6', 'cond-1', 'action-1'),
            edge('e7', 'action-1', 'action-2'),
            edge('e8', 'cond-1', 'action-3'),
        ],
    },

    // ── 2. FAQ for Online Stores ─────────────────────────────────────
    {
        name: 'FAQ for Online Stores',
        description: 'Answer e-commerce questions about shipping, returns, sizing, and payments from your knowledge base.',
        category: 'support',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 89400,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Great question! Let me get a team member to help with that.',
            instruction: 'Retrieve shipping, return, sizing, and payment policy answers from store knowledge base'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Says', subtype: 'visitor_says', config: { keywords: ['shipping', 'return', 'size', 'payment', 'delivery', 'refund', 'exchange'] } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Acknowledge', subtype: 'send_message', config: { message: 'Good question! Let me check that for you.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Answer', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'More Help', subtype: 'decision_buttons', config: { buttons: ['That helps!', 'I have another question', 'Talk to support'] } }),
            node('cond-1', 'flow_condition', 400, 560, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'Talk to support' } }),
            node('action-4', 'flow_action', 300, 680, { label: 'Handoff', subtype: 'send_message', config: { message: 'Connecting you with our support team now. Hang tight!' } }),
            node('action-5', 'flow_action', 550, 680, { label: 'Happy', subtype: 'send_message', config: { message: 'Glad I could help! Happy shopping!' } }),
            ...ragPipeline(80, 'Retrieve shipping, return, sizing, and payment policies from store knowledge base').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'cond-1'),
            edge('e6', 'cond-1', 'action-4'),
            edge('e7', 'cond-1', 'action-5'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 3. Track Your Order ──────────────────────────────────────────
    {
        name: 'Track Your Order',
        description: 'Help customers check their order status with AI-assisted lookup and shipping info from your knowledge base.',
        category: 'support',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 67800,
        tone_default: 'professional',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'I can\'t find that order. Let me connect you with our team for a manual lookup.',
            instruction: 'Retrieve order tracking process, shipping carrier info, and estimated delivery times'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Says', subtype: 'visitor_says', config: { keywords: ['track', 'order', 'where is', 'shipping', 'delivery', 'status'] } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Greet', subtype: 'send_message', config: { message: 'I can help you track your order! Let me pull up the details.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Order ID', subtype: 'ask_question', config: { question: 'What\'s your order number?', variable: 'order_id' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Email', subtype: 'ask_question', config: { question: 'And the email used for the order?', variable: 'order_email' } }),
            node('action-4', 'flow_action', 400, 560, { label: 'Status', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-5', 'flow_action', 400, 680, { label: 'More Help', subtype: 'decision_buttons', config: { buttons: ['That\'s all, thanks!', 'I have an issue with my order', 'Talk to support'] } }),
            node('cond-1', 'flow_condition', 400, 800, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'I have an issue with my order' } }),
            node('action-6', 'flow_action', 300, 920, { label: 'Issue', subtype: 'ask_question', config: { question: 'What\'s the issue? I\'ll do my best to help.', variable: 'issue' } }),
            node('action-7', 'flow_action', 300, 1040, { label: 'Answer', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-8', 'flow_action', 550, 920, { label: 'Handoff', subtype: 'send_message', config: { message: 'Connecting you with support now. They\'ll take it from here!' } }),
            ...ragPipeline(80, 'Retrieve order tracking instructions, shipping carrier details, and delivery estimates').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'action-4'),
            edge('e6', 'action-4', 'action-5'),
            edge('e7', 'action-5', 'cond-1'),
            edge('e8', 'cond-1', 'action-6'),
            edge('e9', 'action-6', 'action-7'),
            edge('e10', 'cond-1', 'action-8'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 4. AI Responder (Full RAG Answering) ─────────────────────────
    {
        name: 'AI Responder',
        description: 'Full AI-powered responder that answers any question using your entire knowledge base — your 24/7 support agent.',
        category: 'support',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 134000,
        tone_default: 'professional',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'I want to make sure you get the right answer. Let me connect you with our team.',
            instruction: 'Retrieve the most relevant answer from the ENTIRE knowledge base — all documents, FAQs, policies'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Any Message', subtype: 'visitor_says' }),
            node('rag-1', 'flow_rag', 400, 200, { label: 'Embed Query', subtype: 'embed_query', category: 'retrieval', config: { input_variable: '{{message_text}}' } }),
            node('rag-2', 'flow_rag', 400, 320, { label: 'Vector Search', subtype: 'vector_search', category: 'retrieval', config: { top_k: 8, min_score: 0.7 } }),
            node('rag-3', 'flow_rag', 400, 440, { label: 'Context Builder', subtype: 'context_builder', category: 'retrieval', config: { format: 'numbered', include_sources: true } }),
            node('rag-4', 'flow_rag', 400, 560, { label: 'LLM Call', subtype: 'llm_call', category: 'llm', config: { model: 'sarvam', temperature: 0.5, max_tokens: 600 } }),
            node('cond-1', 'flow_condition', 400, 680, { label: 'Confidence', subtype: 'based_on_variable', config: { variable: 'rag_confidence', operator: 'gte', value: '0.75' } }),
            node('action-1', 'flow_action', 250, 800, { label: 'AI Answer', subtype: 'send_message', config: { message: '{{llm_response}}' } }),
            node('action-2', 'flow_action', 250, 920, { label: 'Feedback', subtype: 'decision_buttons', config: { buttons: ['Helpful', 'Not helpful', 'Talk to human'] } }),
            node('action-3', 'flow_action', 550, 800, { label: 'Handoff', subtype: 'send_message', config: { message: 'Let me connect you with a team member who can help better.' } }),
        ],
        edges: [
            edge('e1', 'trigger-1', 'rag-1'),
            edge('e2', 'rag-1', 'rag-2'),
            edge('e3', 'rag-2', 'rag-3'),
            edge('e4', 'rag-3', 'rag-4'),
            edge('e5', 'rag-4', 'cond-1'),
            edge('e6', 'cond-1', 'action-1'),
            edge('e7', 'action-1', 'action-2'),
            edge('e8', 'cond-1', 'action-3'),
        ],
    },

    // ── 5. Respond to Greetings ─────────────────────────────────────
    {
        name: 'Respond to Greetings',
        description: 'Automatically respond to greetings with a warm, context-aware welcome and quick options.',
        category: 'support',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 78200,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Hi! How can I help you today?',
            instruction: 'Retrieve current promotions, popular FAQs, and business hours for context-aware greeting'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Says', subtype: 'visitor_says', config: { keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'howdy'] } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Greet Back', subtype: 'send_message', config: { message: 'Hey there! Welcome! How can I help you today?' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Quick Menu', subtype: 'decision_buttons', config: { buttons: ['I have a question', 'Browse products', 'Track my order', 'Talk to support'] } }),
            node('cond-1', 'flow_condition', 400, 440, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'I have a question' } }),
            node('action-3', 'flow_action', 250, 560, { label: 'Ask', subtype: 'ask_question', config: { question: 'Sure! What would you like to know?', variable: 'question' } }),
            node('action-4', 'flow_action', 250, 680, { label: 'Answer', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-5', 'flow_action', 500, 560, { label: 'Route', subtype: 'send_message', config: { message: 'I\'ll get you to the right place!' } }),
            ...ragPipeline(80, 'Retrieve top FAQs, current promotions, and quick-help topics for greeting context').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'cond-1'),
            edge('e5', 'cond-1', 'action-3'),
            edge('e6', 'action-3', 'action-4'),
            edge('e7', 'cond-1', 'action-5'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 6. Automate Repetitive Answers ───────────────────────────────
    {
        name: 'Automate Repetitive Answers',
        description: 'Automatically answer the most common questions your team gets, freeing up agents for complex issues.',
        category: 'support',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 95600,
        tone_default: 'professional',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'That\'s a great question — let me get someone who can give you the best answer.',
            instruction: 'Retrieve canned responses and FAQ answers for the most common support questions'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Says', subtype: 'visitor_says', config: { keywords: ['hours', 'price', 'cost', 'location', 'address', 'phone', 'contact', 'open', 'close'] } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Quick Answer', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Helpful?', subtype: 'decision_buttons', config: { buttons: ['Perfect, thanks!', 'I need more info', 'Talk to a person'] } }),
            node('cond-1', 'flow_condition', 400, 440, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'I need more info' } }),
            node('action-3', 'flow_action', 300, 560, { label: 'Details', subtype: 'ask_question', config: { question: 'What else would you like to know?', variable: 'follow_up' } }),
            node('action-4', 'flow_action', 300, 680, { label: 'Follow Up Answer', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-5', 'flow_action', 550, 560, { label: 'Handoff', subtype: 'send_message', config: { message: 'No problem! Connecting you with our team now.' } }),
            ...ragPipeline(80, 'Retrieve canned responses for common questions: hours, pricing, location, contact info').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'cond-1'),
            edge('e5', 'cond-1', 'action-3'),
            edge('e6', 'action-3', 'action-4'),
            edge('e7', 'cond-1', 'action-5'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 7. Advanced Return Request Handler ───────────────────────────
    {
        name: 'Advanced Return Request Handler',
        description: 'Walk customers through the return process step-by-step with policy details pulled from your knowledge base.',
        category: 'support',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 42300,
        tone_default: 'professional',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'I\'ll connect you with our returns team who can process this for you.',
            instruction: 'Retrieve return policy, return window, eligible conditions, and return shipping process'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Says', subtype: 'visitor_says', config: { keywords: ['return', 'refund', 'exchange', 'send back', 'defective', 'wrong item'] } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Acknowledge', subtype: 'send_message', config: { message: 'I\'m sorry to hear that. I\'ll help you with the return process.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Reason', subtype: 'decision_buttons', config: { buttons: ['Wrong item received', 'Defective/damaged', 'Changed my mind', 'Doesn\'t fit', 'Other'] } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Order ID', subtype: 'ask_question', config: { question: 'What\'s your order number?', variable: 'order_id' } }),
            node('action-4', 'flow_action', 400, 560, { label: 'Policy', subtype: 'send_message', config: { message: 'Here\'s our return policy for your case:\n\n{{rag_response}}' } }),
            node('action-5', 'flow_action', 400, 680, { label: 'Decision', subtype: 'decision_buttons', config: { buttons: ['Start return', 'I have more questions', 'Talk to an agent'] } }),
            node('cond-1', 'flow_condition', 400, 800, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'Start return' } }),
            node('action-6', 'flow_action', 250, 920, { label: 'Email', subtype: 'ask_question', config: { question: 'Confirm your email for the return label:', variable: 'return_email' } }),
            node('action-7', 'flow_action', 250, 1040, { label: 'Done', subtype: 'send_message', config: { message: 'Your return is initiated! Check your email for the return label and instructions.' } }),
            node('action-8', 'flow_action', 550, 920, { label: 'Handoff', subtype: 'send_message', config: { message: 'Let me connect you with our returns specialist.' } }),
            ...ragPipeline(80, 'Retrieve return policy, eligible conditions, return window, and shipping label instructions').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'action-4'),
            edge('e6', 'action-4', 'action-5'),
            edge('e7', 'action-5', 'cond-1'),
            edge('e8', 'cond-1', 'action-6'),
            edge('e9', 'action-6', 'action-7'),
            edge('e10', 'cond-1', 'action-8'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 8. No Response Escalation ────────────────────────────────────
    {
        name: 'No Response Escalation',
        description: 'Detect when visitors go silent during a conversation and attempt to re-engage or escalate.',
        category: 'support',
        trigger_type: 'no_response',
        is_active: false,
        uses: 23400,
        tone_default: 'warm',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Still there? We\'ll save your conversation — come back anytime!',
            instruction: 'Retrieve FAQ answers related to the last discussed topic for re-engagement'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'No Response', subtype: 'no_response', config: { timeout_minutes: 2 } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Check In', subtype: 'send_message', config: { message: 'Still there? I\'m here if you need anything!' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Helpful Context', subtype: 'send_message', config: { message: 'In the meantime, this might help:\n\n{{rag_response}}' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Options', subtype: 'decision_buttons', config: { buttons: ['I\'m back!', 'Email me instead', 'Close chat'] } }),
            node('cond-1', 'flow_condition', 400, 560, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'Email me instead' } }),
            node('action-4', 'flow_action', 300, 680, { label: 'Email', subtype: 'ask_question', config: { question: 'What\'s your email? We\'ll follow up there.', variable: 'visitor_email' } }),
            node('action-5', 'flow_action', 300, 800, { label: 'Saved', subtype: 'send_message', config: { message: 'Got it! We\'ll email you with a follow-up. Take care!' } }),
            node('action-6', 'flow_action', 550, 680, { label: 'Close', subtype: 'send_message', config: { message: 'No worries! Your conversation is saved. Come back anytime.' } }),
            ...ragPipeline(80, 'Retrieve FAQ answers related to the last conversation topic for re-engagement').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'cond-1'),
            edge('e6', 'cond-1', 'action-4'),
            edge('e7', 'action-4', 'action-5'),
            edge('e8', 'cond-1', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 9. Missed Conversation Handler ───────────────────────────────
    {
        name: 'Missed Conversation Handler',
        description: 'Handle conversations that agents missed by collecting contact info and providing instant AI answers.',
        category: 'support',
        trigger_type: 'agent_unavailable',
        is_active: false,
        uses: 31200,
        tone_default: 'warm',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'All agents are busy right now. Leave your details and we\'ll get back to you!',
            instruction: 'Retrieve relevant FAQ answers to help while waiting, plus business hours and SLA info'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Agent Unavailable', subtype: 'agent_unavailable', config: { wait_seconds: 30 } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Apologize', subtype: 'send_message', config: { message: 'Sorry, all our agents are busy at the moment. But I can still try to help!' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Decision', subtype: 'decision_buttons', config: { buttons: ['Try AI answer', 'Leave a message', 'Call me back'] } }),
            node('cond-1', 'flow_condition', 400, 440, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'Try AI answer' } }),
            node('action-3', 'flow_action', 200, 560, { label: 'Ask', subtype: 'ask_question', config: { question: 'Sure! What\'s your question?', variable: 'question' } }),
            node('action-4', 'flow_action', 200, 680, { label: 'AI Answer', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-5', 'flow_action', 400, 560, { label: 'Message', subtype: 'ask_question', config: { question: 'Leave your message, name, and email — we\'ll respond ASAP:', variable: 'message_details' } }),
            node('action-6', 'flow_action', 400, 680, { label: 'Confirm', subtype: 'send_message', config: { message: 'Got it! A team member will follow up as soon as possible.' } }),
            node('action-7', 'flow_action', 600, 560, { label: 'Callback', subtype: 'ask_question', config: { question: 'What\'s the best number to reach you?', variable: 'phone' } }),
            node('action-8', 'flow_action', 600, 680, { label: 'Callback Confirm', subtype: 'send_message', config: { message: 'We\'ll call you back shortly. Thanks for your patience!' } }),
            ...ragPipeline(80, 'Retrieve FAQ answers to help visitor while agents are unavailable').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'cond-1'),
            edge('e5', 'cond-1', 'action-3'),
            edge('e6', 'action-3', 'action-4'),
            edge('e7', 'cond-1', 'action-5'),
            edge('e8', 'action-5', 'action-6'),
            edge('e9', 'cond-1', 'action-7'),
            edge('e10', 'action-7', 'action-8'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 10. Digital Menu (Restaurant) ────────────────────────────────
    {
        name: 'Digital Menu',
        description: 'Present your restaurant menu interactively with dish details, allergens, and recommendations from your knowledge base.',
        category: 'support',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 14500,
        tone_default: 'warm',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'Check out our full menu on the website, or ask the staff for recommendations!',
            instruction: 'Retrieve menu items, prices, allergen info, and chef recommendations by category'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Says', subtype: 'visitor_says', config: { keywords: ['menu', 'food', 'dishes', 'eat', 'order', 'vegan', 'gluten'] } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Welcome', subtype: 'send_message', config: { message: 'Welcome! Let me show you our menu. What are you in the mood for?' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Category', subtype: 'decision_buttons', config: { buttons: ['Starters', 'Main Course', 'Desserts', 'Drinks', 'Chef\'s Special'] } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Menu Items', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-4', 'flow_action', 400, 560, { label: 'Dietary', subtype: 'decision_buttons', config: { buttons: ['Any allergen info?', 'Vegan options', 'I\'m ready to order', 'See more'] } }),
            node('cond-1', 'flow_condition', 400, 680, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'I\'m ready to order' } }),
            node('action-5', 'flow_action', 300, 800, { label: 'Order', subtype: 'send_message', config: { message: 'Great choice! Please let the staff know or place your order through our app.' } }),
            node('action-6', 'flow_action', 550, 800, { label: 'More Info', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            ...ragPipeline(80, 'Retrieve menu items, prices, descriptions, allergen info, and dietary options').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'action-4'),
            edge('e6', 'action-4', 'cond-1'),
            edge('e7', 'cond-1', 'action-5'),
            edge('e8', 'cond-1', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 11. Review Protector ─────────────────────────────────────────
    {
        name: 'Review Protector',
        description: 'Intercept unhappy customers before they leave negative reviews — resolve issues proactively with AI assistance.',
        category: 'support',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 19800,
        tone_default: 'warm',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'I\'m really sorry about your experience. Let me get a manager to help.',
            instruction: 'Retrieve resolution options, compensation policies, and complaint handling procedures'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Says', subtype: 'visitor_says', config: { keywords: ['unhappy', 'disappointed', 'terrible', 'worst', 'complaint', 'bad experience', 'angry'] } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Empathize', subtype: 'send_message', config: { message: 'I\'m really sorry to hear that. Your experience matters to us, and I want to make this right.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Issue', subtype: 'ask_question', config: { question: 'Could you tell me what went wrong? I\'m here to help.', variable: 'complaint' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Resolution', subtype: 'send_message', config: { message: 'Thank you for sharing. Here\'s what we can do:\n\n{{rag_response}}' } }),
            node('action-4', 'flow_action', 400, 560, { label: 'Resolution Options', subtype: 'decision_buttons', config: { buttons: ['That works for me', 'I want to talk to a manager', 'Refund please'] } }),
            node('cond-1', 'flow_condition', 400, 680, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'That works for me' } }),
            node('action-5', 'flow_action', 250, 800, { label: 'Resolved', subtype: 'send_message', config: { message: 'I\'m glad we could help! We value your feedback and will use it to improve.' } }),
            node('action-6', 'flow_action', 550, 800, { label: 'Escalate', subtype: 'send_message', config: { message: 'I completely understand. Connecting you with a manager right now — they\'ll take great care of you.' } }),
            ...ragPipeline(80, 'Retrieve resolution options, compensation policies, and complaint handling procedures').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'action-4'),
            edge('e6', 'action-4', 'cond-1'),
            edge('e7', 'cond-1', 'action-5'),
            edge('e8', 'cond-1', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 12. Thank Positive Reviewers ─────────────────────────────────
    {
        name: 'Thank Positive Reviewers',
        description: 'Automatically thank customers who leave positive feedback and encourage referrals.',
        category: 'support',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 16700,
        tone_default: 'friendly',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'We really appreciate your kind words! Thank you for being an amazing customer.',
            instruction: 'Retrieve referral program details, loyalty rewards, and social sharing links'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Says', subtype: 'visitor_says', config: { keywords: ['love', 'amazing', 'great', 'excellent', 'awesome', 'thank you', 'best', 'perfect'] } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Thank', subtype: 'send_message', config: { message: 'That made our day! Thanks so much for the kind words!' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Share', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Referral', subtype: 'decision_buttons', config: { buttons: ['Share with friends', 'Join loyalty program', 'Leave a review'] } }),
            node('cond-1', 'flow_condition', 400, 560, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'Join loyalty program' } }),
            node('action-4', 'flow_action', 300, 680, { label: 'Email', subtype: 'ask_question', config: { question: 'Enter your email to join our loyalty program:', variable: 'visitor_email' } }),
            node('action-5', 'flow_action', 300, 800, { label: 'Enrolled', subtype: 'send_message', config: { message: 'You\'re in! Check your email for your loyalty perks.' } }),
            node('action-6', 'flow_action', 550, 680, { label: 'Review Link', subtype: 'send_message', config: { message: 'We\'d love a review! Share your experience here: [Review Link]\n\nThank you!' } }),
            ...ragPipeline(80, 'Retrieve referral program details, loyalty perks, and review/social sharing links').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'cond-1'),
            edge('e6', 'cond-1', 'action-4'),
            edge('e7', 'action-4', 'action-5'),
            edge('e8', 'cond-1', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 13. Product Availability Check ───────────────────────────────
    {
        name: 'Product Availability Check',
        description: 'Let visitors check if a product is in stock, with smart alternatives suggested when it\'s not.',
        category: 'support',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 28900,
        tone_default: 'professional',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'I\'m not sure about that product. Let me connect you with our team to check.',
            instruction: 'Retrieve product stock status, expected restock dates, and similar available alternatives'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Says', subtype: 'visitor_says', config: { keywords: ['in stock', 'available', 'do you have', 'out of stock', 'restock', 'when available'] } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Check', subtype: 'ask_question', config: { question: 'Which product are you looking for?', variable: 'product_query' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Result', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Next', subtype: 'decision_buttons', config: { buttons: ['Add to cart', 'Notify when restocked', 'Show alternatives'] } }),
            node('cond-1', 'flow_condition', 400, 560, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'Notify when restocked' } }),
            node('action-4', 'flow_action', 250, 680, { label: 'Notify Email', subtype: 'ask_question', config: { question: 'Drop your email and we\'ll notify you:', variable: 'visitor_email' } }),
            node('action-5', 'flow_action', 250, 800, { label: 'Done', subtype: 'send_message', config: { message: 'You\'re on the notification list! We\'ll email you the moment it\'s back.' } }),
            node('action-6', 'flow_action', 550, 680, { label: 'Alternatives', subtype: 'send_message', config: { message: 'Here are some similar products you might like:\n\n{{rag_response}}' } }),
            ...ragPipeline(80, 'Retrieve product stock status, restock dates, and similar available alternatives').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'cond-1'),
            edge('e6', 'cond-1', 'action-4'),
            edge('e7', 'action-4', 'action-5'),
            edge('e8', 'cond-1', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },

    // ── 14. Shipping Zones Explainer ─────────────────────────────────
    {
        name: 'Shipping Zones Explainer',
        description: 'Explain shipping costs, delivery times, and zones with location-specific details from your knowledge base.',
        category: 'support',
        trigger_type: 'visitor_says',
        is_active: false,
        uses: 21300,
        tone_default: 'professional',
        rag_config: {
            enabled: true,
            min_confidence: 0.75,
            fallback_message: 'I\'ll connect you with our team for specific shipping details to your location.',
            instruction: 'Retrieve shipping zones, costs per zone, estimated delivery times, and carrier info'
        },
        nodes: [
            node('trigger-1', 'flow_trigger', 400, 80, { label: 'Visitor Says', subtype: 'visitor_says', config: { keywords: ['shipping', 'deliver to', 'ship to', 'shipping cost', 'how long', 'delivery time'] } }),
            node('action-1', 'flow_action', 400, 200, { label: 'Start', subtype: 'send_message', config: { message: 'I can help with shipping info! Let me check for your location.' } }),
            node('action-2', 'flow_action', 400, 320, { label: 'Location', subtype: 'ask_question', config: { question: 'Where should we ship to? (Country or ZIP code)', variable: 'ship_location' } }),
            node('action-3', 'flow_action', 400, 440, { label: 'Info', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-4', 'flow_action', 400, 560, { label: 'More', subtype: 'decision_buttons', config: { buttons: ['Sounds good!', 'Express shipping options?', 'I need help with something else'] } }),
            node('cond-1', 'flow_condition', 400, 680, { label: 'Check', subtype: 'based_on_variable', config: { variable: 'button_clicked', operator: 'equals', value: 'Express shipping options?' } }),
            node('action-5', 'flow_action', 300, 800, { label: 'Express', subtype: 'send_message', config: { message: '{{rag_response}}' } }),
            node('action-6', 'flow_action', 550, 800, { label: 'Close', subtype: 'send_message', config: { message: 'Happy to help! Let us know if you need anything else.' } }),
            ...ragPipeline(80, 'Retrieve shipping zones, costs, estimated delivery times, express options, and carrier details').nodes,
        ],
        edges: [
            edge('e1', 'trigger-1', 'action-1'),
            edge('e2', 'trigger-1', 'rag-embed'),
            edge('e3', 'action-1', 'action-2'),
            edge('e4', 'action-2', 'action-3'),
            edge('e5', 'action-3', 'action-4'),
            edge('e6', 'action-4', 'cond-1'),
            edge('e7', 'cond-1', 'action-5'),
            edge('e8', 'cond-1', 'action-6'),
            ...ragPipeline(80, '').edges,
        ],
    },
];

// Helper to get templates by category
export function getTemplatesByCategory(category: string): FlowTemplate[] {
    if (category === 'all') return flowTemplates;
    return flowTemplates.filter(t => t.category === category);
}

// Get template count per category
export function getTemplateCounts(): Record<string, number> {
    return flowTemplates.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}
