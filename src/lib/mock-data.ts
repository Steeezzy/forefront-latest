/**
 * Mock data fallbacks for when the backend is unavailable.
 * apiFetch will return these when real API calls fail.
 */

// ── Auth / Agent ──────────────────────────────────────────────
const mockUser = {
  id: "usr_demo_001",
  email: "demo@forefront.ai",
  name: "Sarah Chen",
};

const mockWorkspace = {
  id: "ws_demo_001",
  name: "Forefront Demo",
};

const mockAgent = {
  id: "agent_demo_001",
  name: "Lyro AI",
  workspace_id: "ws_demo_001",
  is_active: true,
  created_at: "2025-12-01T00:00:00Z",
};

// ── Inbox Stats ───────────────────────────────────────────────
const mockInboxStats = {
  open_count: 12,
  closed_count: 47,
  snoozed_count: 3,
  unassigned_count: 5,
  unread_count: 8,
};

const mockTicketStats = {
  open_count: "6",
  pending_count: "2",
  solved_count: "34",
  closed_count: "12",
  unassigned_count: "3",
  urgent_open: "1",
  high_open: "2",
  total: "54",
};

// ── Conversations ─────────────────────────────────────────────
const mockConversations = [
  {
    id: "conv_001",
    visitor_name: "Alex Rivera",
    visitor_email: "alex@example.com",
    channel: "web",
    status: "open",
    last_message_preview: "Hi, I need help with my subscription plan upgrade",
    last_message_at: new Date(Date.now() - 3 * 60000).toISOString(),
    is_read: false,
    ai_resolved: false,
    agent_takeover: false,
    auto_reply_paused: false,
    was_escalated: false,
    priority: "normal",
  },
  {
    id: "conv_002",
    visitor_name: "Maria Santos",
    visitor_email: "maria.s@company.io",
    channel: "whatsapp",
    status: "open",
    last_message_preview: "Can you check order #4821? It hasn't arrived yet",
    last_message_at: new Date(Date.now() - 12 * 60000).toISOString(),
    is_read: false,
    ai_resolved: false,
    agent_takeover: true,
    auto_reply_paused: false,
    was_escalated: true,
    priority: "high",
  },
  {
    id: "conv_003",
    visitor_name: "James Wilson",
    visitor_email: "jwilson@startup.dev",
    channel: "email",
    status: "open",
    last_message_preview: "Thanks! The API integration is working now",
    last_message_at: new Date(Date.now() - 45 * 60000).toISOString(),
    is_read: true,
    ai_resolved: true,
    agent_takeover: false,
    auto_reply_paused: false,
    was_escalated: false,
    priority: "normal",
  },
  {
    id: "conv_004",
    visitor_name: "Priya Patel",
    visitor_email: "priya@techcorp.com",
    channel: "messenger",
    status: "open",
    last_message_preview: "I'd like to know more about your enterprise pricing",
    last_message_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    is_read: true,
    ai_resolved: false,
    agent_takeover: false,
    auto_reply_paused: false,
    was_escalated: false,
    priority: "normal",
  },
  {
    id: "conv_005",
    visitor_name: "Tom Baker",
    visitor_email: "tom.b@agency.co",
    channel: "instagram",
    status: "open",
    last_message_preview: "Love the new feature! Quick question about setup though",
    last_message_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    is_read: true,
    ai_resolved: true,
    agent_takeover: false,
    auto_reply_paused: false,
    was_escalated: false,
    priority: "normal",
  },
  {
    id: "conv_006",
    visitor_name: "Yuki Tanaka",
    visitor_email: "yuki@store.jp",
    channel: "web",
    status: "open",
    last_message_preview: "Is there a way to export conversation history?",
    last_message_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    is_read: true,
    ai_resolved: false,
    agent_takeover: false,
    auto_reply_paused: false,
    was_escalated: false,
    priority: "normal",
  },
];

// ── Conversation Messages ─────────────────────────────────────
function mockMessagesForConversation(conversationId: string) {
  const baseTime = Date.now() - 30 * 60000;
  const messagesMap: Record<string, any[]> = {
    conv_001: [
      { id: "msg_001", sender_type: "visitor", content: "Hi, I need help with my subscription plan upgrade", created_at: new Date(baseTime).toISOString() },
      { id: "msg_002", sender_type: "ai", content: "Hello Alex! I'd be happy to help you with your subscription upgrade. 🎉\n\nWe offer three plans:\n- **Starter** — $29/mo (up to 1,000 conversations)\n- **Growth** — $79/mo (up to 5,000 conversations)\n- **Scale** — $199/mo (unlimited conversations)\n\nWhich plan are you interested in, or would you like me to recommend one based on your usage?", created_at: new Date(baseTime + 5000).toISOString(), ai_confidence: 0.94 },
      { id: "msg_003", sender_type: "visitor", content: "I'm currently on Starter and hitting the limit. What does Growth include?", created_at: new Date(baseTime + 120000).toISOString() },
      { id: "msg_004", sender_type: "ai", content: "Great question! The **Growth plan** includes:\n\n✅ Up to 5,000 conversations/month\n✅ Advanced AI training with custom data\n✅ Priority support (4hr response time)\n✅ Team collaboration (up to 5 agents)\n✅ Custom integrations (Slack, Zapier, HubSpot)\n✅ Analytics dashboard\n\nWould you like to upgrade, or do you have any other questions?", created_at: new Date(baseTime + 130000).toISOString(), ai_confidence: 0.91 },
    ],
    conv_002: [
      { id: "msg_010", sender_type: "visitor", content: "Hi, I placed an order last week and it still hasn't arrived", created_at: new Date(baseTime - 600000).toISOString() },
      { id: "msg_011", sender_type: "ai", content: "I'm sorry to hear about the delay, Maria. Could you share your order number so I can look into it?", created_at: new Date(baseTime - 595000).toISOString(), ai_confidence: 0.88 },
      { id: "msg_012", sender_type: "visitor", content: "Can you check order #4821? It hasn't arrived yet", created_at: new Date(baseTime - 180000).toISOString() },
      { id: "msg_013", sender_type: "system", content: "Conversation escalated to human agent", created_at: new Date(baseTime - 170000).toISOString(), message_type: "escalation" },
      { id: "msg_014", sender_type: "agent", content: "Hi Maria, I've looked into order #4821. It appears there was a shipping delay due to weather. Your package is now in transit and should arrive by tomorrow. I've also added a 15% discount to your next order for the inconvenience. 📦", created_at: new Date(baseTime - 60000).toISOString(), sender_name: "Sarah Chen" },
    ],
    conv_003: [
      { id: "msg_020", sender_type: "visitor", content: "I'm trying to set up the API integration but getting a 403 error", created_at: new Date(baseTime - 7200000).toISOString() },
      { id: "msg_021", sender_type: "ai", content: "That 403 error usually means the API key doesn't have the right permissions. Let me help:\n\n1. Go to **Settings → Developer → API Keys**\n2. Click on your key and check the scopes\n3. Make sure 'read:conversations' and 'write:messages' are enabled\n\nCould you try regenerating the key with those permissions?", created_at: new Date(baseTime - 7190000).toISOString(), ai_confidence: 0.96 },
      { id: "msg_022", sender_type: "visitor", content: "Thanks! The API integration is working now", created_at: new Date(baseTime - 2700000).toISOString() },
      { id: "msg_023", sender_type: "ai", content: "Awesome, glad it's working! 🎉 If you need any help with the API in the future, feel free to reach out. Have a great day!", created_at: new Date(baseTime - 2690000).toISOString(), ai_confidence: 0.97 },
    ],
  };

  return messagesMap[conversationId] || [
    { id: `msg_default_1`, sender_type: "visitor", content: "Hi, I have a question", created_at: new Date(baseTime).toISOString() },
    { id: `msg_default_2`, sender_type: "ai", content: "Hello! I'd be happy to help. What can I assist you with today?", created_at: new Date(baseTime + 5000).toISOString(), ai_confidence: 0.95 },
  ];
}

// ── Tickets ───────────────────────────────────────────────────
const mockTickets = [
  {
    id: "tkt_001",
    ticket_number: "TKT-1042",
    subject: "Payment processing error on checkout",
    description: "Customer reports getting a 'payment declined' error even though their card works fine on other sites.",
    status: "open",
    priority: "urgent",
    source: "web",
    assigned_to: "usr_demo_001",
    assignee_email: "demo@forefront.ai",
    requester_name: "David Kim",
    requester_email: "david.kim@shopify-store.com",
    tags: ["payment", "bug", "checkout"],
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "tkt_002",
    ticket_number: "TKT-1041",
    subject: "Feature request: Dark mode for widget",
    description: "Multiple customers have asked for a dark mode option in the chat widget to match their websites.",
    status: "open",
    priority: "medium",
    source: "email",
    requester_name: "Emma Watson",
    requester_email: "emma@design-agency.com",
    tags: ["feature-request", "widget", "ui"],
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "tkt_003",
    ticket_number: "TKT-1040",
    subject: "Widget not loading on Safari",
    description: "The chat widget fails to load on Safari 17.x. Console shows a CORS error.",
    status: "open",
    priority: "high",
    source: "web",
    assigned_to: "usr_demo_001",
    assignee_email: "demo@forefront.ai",
    requester_name: "Chen Wei",
    requester_email: "chen.wei@techstartup.io",
    tags: ["bug", "safari", "widget"],
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "tkt_004",
    ticket_number: "TKT-1039",
    subject: "API rate limiting questions",
    description: "Need clarification on API rate limits for the Growth plan.",
    status: "pending",
    priority: "low",
    source: "email",
    requester_name: "Sarah Johnson",
    requester_email: "sarah@devshop.com",
    tags: ["api", "billing"],
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: "tkt_005",
    ticket_number: "TKT-1038",
    subject: "Webhook delivery failures",
    description: "Our webhook endpoint is receiving duplicate events and some are arriving out of order.",
    status: "solved",
    priority: "high",
    source: "web",
    assigned_to: "usr_demo_001",
    assignee_email: "demo@forefront.ai",
    requester_name: "Marcus Lee",
    requester_email: "marcus@saas-platform.com",
    tags: ["webhook", "bug"],
    created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
];

function mockTicketDetail(ticketId: string) {
  const ticket = mockTickets.find(t => t.id === ticketId) || mockTickets[0];
  const comments = [
    {
      id: "cmt_001",
      author_type: "customer" as const,
      author_name: ticket.requester_name,
      content: ticket.description || "Issue reported",
      is_internal: false,
      created_at: ticket.created_at,
    },
    {
      id: "cmt_002",
      author_type: "agent" as const,
      author_id: "usr_demo_001",
      author_name: "Sarah Chen",
      content: "Thanks for reporting this. I'm looking into it now and will update you shortly.",
      is_internal: false,
      created_at: new Date(new Date(ticket.created_at).getTime() + 30 * 60000).toISOString(),
    },
    {
      id: "cmt_003",
      author_type: "agent" as const,
      author_id: "usr_demo_001",
      author_name: "Sarah Chen",
      content: "Checked the logs — this looks related to the v2.3 release. Flagging for engineering.",
      is_internal: true,
      created_at: new Date(new Date(ticket.created_at).getTime() + 45 * 60000).toISOString(),
    },
  ];
  return { ticket, comments };
}

// ── Flows ─────────────────────────────────────────────────────
const mockFlows = [
  {
    id: "flow_001",
    name: "Welcome Message",
    description: "Greets new visitors and offers help options",
    trigger_type: "page_visit",
    is_active: true,
    created_at: "2025-11-15T10:00:00Z",
    updated_at: "2026-02-20T14:00:00Z",
    execution_count: 4821,
    engagement_rate: 34.2,
  },
  {
    id: "flow_002",
    name: "Cart Abandonment Recovery",
    description: "Triggers when a user has items in cart and tries to leave",
    trigger_type: "exit_intent",
    is_active: true,
    created_at: "2025-12-01T08:00:00Z",
    updated_at: "2026-02-18T09:00:00Z",
    execution_count: 1256,
    engagement_rate: 22.8,
  },
  {
    id: "flow_003",
    name: "Product Recommendation",
    description: "Suggests products based on browsing history",
    trigger_type: "time_on_page",
    is_active: true,
    created_at: "2026-01-05T12:00:00Z",
    updated_at: "2026-02-15T16:00:00Z",
    execution_count: 892,
    engagement_rate: 41.5,
  },
  {
    id: "flow_004",
    name: "Lead Qualification",
    description: "Qualifies visitors with a conversational form",
    trigger_type: "page_visit",
    is_active: false,
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-02-10T11:00:00Z",
    execution_count: 312,
    engagement_rate: 18.6,
  },
  {
    id: "flow_005",
    name: "Support Routing",
    description: "Routes support queries to the right team based on topic",
    trigger_type: "visitor_message",
    is_active: true,
    created_at: "2026-02-01T14:00:00Z",
    updated_at: "2026-02-25T08:00:00Z",
    execution_count: 2103,
    engagement_rate: 56.3,
  },
];

const mockFlowTemplates = [
  { name: "Welcome & Greet", description: "Greet new visitors with a friendly message and quick action buttons", category: "support" as const, trigger_type: "page_visit", uses: 12400 },
  { name: "Cart Recovery", description: "Re-engage shoppers who are about to abandon their cart", category: "sales" as const, trigger_type: "exit_intent", uses: 8700 },
  { name: "Lead Capture Form", description: "Collect visitor information with a conversational form flow", category: "leads" as const, trigger_type: "time_on_page", uses: 6200 },
  { name: "Product Quiz", description: "Help visitors find the right product through a guided quiz", category: "sales" as const, trigger_type: "page_visit", uses: 5100 },
  { name: "FAQ Auto-Response", description: "Automatically answer common questions before routing to agents", category: "support" as const, trigger_type: "visitor_message", uses: 9800 },
  { name: "Discount Popup", description: "Offer a special discount to engaged visitors", category: "sales" as const, trigger_type: "time_on_page", uses: 7300 },
];

// ── Knowledge Sources ─────────────────────────────────────────
const mockKnowledgeSources: any[] = [];

// ── Integrations ──────────────────────────────────────────────
const mockIntegrations = [
  { integration_type: "shopify", status: "connected" },
  { integration_type: "google-analytics", status: "connected" },
  { integration_type: "zapier", status: "connected" },
  { integration_type: "slack", status: "connected" },
];

// ── Billing ───────────────────────────────────────────────────
const mockBillingStatus = {
  plan: "growth",
  status: "active",
  periodEnd: new Date(Date.now() + 22 * 24 * 3600000).toISOString(),
  usage: { messages: 1847 },
  limits: { messages: 5000 },
};

// ── Channels ──────────────────────────────────────────────────
const mockChannelSettings = {
  web: { enabled: true, auto_reply: true, greeting: "Hi! How can we help?" },
  email: { enabled: true, auto_reply: false },
  whatsapp: { enabled: false, auto_reply: false },
  instagram: { enabled: false, auto_reply: false },
  messenger: { enabled: false, auto_reply: false },
};

const mockEmailConnections: any[] = [];
const mockSocialAccounts: any[] = [];

// ── Domains ───────────────────────────────────────────────────
const mockDomains = {
  widget: [],
  custom: [],
  email: [],
};

// ── Flow Detail ───────────────────────────────────────────────
function mockFlowDetail(flowId: string) {
  const flow = mockFlows.find(f => f.id === flowId) || mockFlows[0];
  return {
    ...flow,
    nodes: [
      { id: "node_1", type: "trigger", data: { label: "Page Visit" }, position: { x: 250, y: 50 } },
      { id: "node_2", type: "message", data: { label: "Welcome Message", content: "Hi! 👋 Welcome! How can I help you today?" }, position: { x: 250, y: 200 } },
      { id: "node_3", type: "buttons", data: { label: "Quick Actions", options: ["Browse Products", "Get Support", "Track Order"] }, position: { x: 250, y: 400 } },
    ],
    edges: [
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
    ],
  };
}

// ── Visitor Info ──────────────────────────────────────────────
function mockVisitorInfo(conversationId: string) {
  const conv = mockConversations.find(c => c.id === conversationId);
  return {
    id: conversationId,
    visitor_name: conv?.visitor_name || "Visitor",
    visitor_email: conv?.visitor_email || "",
    channel: conv?.channel || "web",
    status: conv?.status || "open",
    visitor_ip: "192.168.1.42",
    visitor_country: "United States",
    visitor_city: "San Francisco",
    visitor_os: "macOS 14.2",
    visitor_browser: "Chrome 121",
    page_url: "https://example.com/pricing",
    page_title: "Pricing - Forefront",
    referrer: "https://google.com",
    visits_count: 7,
    first_visit_at: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
    last_visit_at: new Date(Date.now() - 5 * 60000).toISOString(),
    tags: ["prospect", "pricing-page"],
    notes: "",
    custom_properties: {},
  };
}

// ── Actions ───────────────────────────────────────────────────
const mockActions = [
  {
    id: "act_001",
    name: "Check Order Status",
    description: "Look up the status of a customer's order by order number",
    type: "api_call",
    is_active: true,
    created_at: "2026-01-10T10:00:00Z",
    updated_at: "2026-02-20T14:00:00Z",
  },
  {
    id: "act_002",
    name: "Create Support Ticket",
    description: "Automatically creates a support ticket from the conversation",
    type: "internal",
    is_active: true,
    created_at: "2026-01-15T08:00:00Z",
    updated_at: "2026-02-18T09:00:00Z",
  },
];

// ── Route Matching ────────────────────────────────────────────

/**
 * Given a request path (as used by apiFetch, e.g. "/api/inbox/stats"),
 * return mock data if available, or null if no mock matches.
 */
export function getMockResponse(path: string, method: string = "GET"): any | null {
  // Normalize: strip leading /api/proxy if present
  let p = path.replace(/^\/api\/proxy/, "");

  // ── Auth ──
  if (p === "/api/auth/sync" && method === "POST") {
    return { success: true, user: mockUser, workspace: mockWorkspace };
  }

  // ── Agent ──
  if (p === "/agents/primary") {
    return { agent: mockAgent, id: mockAgent.id };
  }

  // ── Inbox ──
  if (p === "/api/inbox/stats") {
    return { data: mockInboxStats };
  }
  if (p.startsWith("/api/inbox/conversations") && !p.includes("/messages") && !p.includes("/read")) {
    const idMatch = p.match(/\/api\/inbox\/conversations\/([^/?]+)$/);
    if (idMatch) {
      return { data: { messages: mockMessagesForConversation(idMatch[1]) } };
    }
    // List
    return { data: mockConversations };
  }
  if (p.match(/\/api\/inbox\/conversations\/[^/]+\/messages/) && method === "POST") {
    return { success: true };
  }
  if (p.match(/\/api\/inbox\/conversations\/[^/]+\/read/) && method === "POST") {
    return { success: true };
  }
  if (p === "/api/inbox/simulate" && method === "POST") {
    return { success: true };
  }

  // ── Channels conversations (takeover/release) ──
  if (p.match(/\/api\/channels\/conversations\/[^/]+\/(takeover|release)/) && method === "POST") {
    return { success: true };
  }

  // ── Tickets ──
  if (p === "/api/tickets/stats") {
    return { data: mockTicketStats };
  }
  if (p.match(/\/api\/tickets\/[^/?]+\/comments$/) && method === "POST") {
    return { success: true };
  }
  if (p.match(/\/api\/tickets\/[^/?]+\/resolve$/) && method === "POST") {
    return { success: true };
  }
  if (p.match(/\/api\/tickets\/[^/?]+$/) && (method === "PUT" || method === "PATCH")) {
    return { success: true };
  }
  if (p.match(/\/api\/tickets\/[^/?]+$/)) {
    const idMatch = p.match(/\/api\/tickets\/([^/?]+)$/);
    const detail = mockTicketDetail(idMatch?.[1] || "tkt_001");
    return { data: detail };
  }
  if (p.startsWith("/api/tickets") && method === "POST") {
    return { ticket: { id: "tkt_new_" + Date.now(), ticket_number: "TKT-" + (1043 + Math.floor(Math.random() * 100)) } };
  }
  if (p.startsWith("/api/tickets")) {
    return { data: { tickets: mockTickets } };
  }

  // ── Flows ──
  if (p === "/api/flows/templates") {
    return { templates: mockFlowTemplates };
  }
  if (p === "/api/flows/from-template" && method === "POST") {
    return { flow: { id: "flow_new_" + Date.now() } };
  }
  if (p === "/api/flows/seed-defaults" && method === "POST") {
    return { success: true };
  }
  if (p.match(/\/api\/flows\/[^/?]+$/) && method === "PUT") {
    return { success: true };
  }
  if (p.match(/\/api\/flows\/[^/?]+$/) && method === "DELETE") {
    return { success: true };
  }
  if (p.match(/\/api\/flows\/[^/?]+$/)) {
    const idMatch = p.match(/\/api\/flows\/([^/?]+)$/);
    return mockFlowDetail(idMatch?.[1] || "flow_001");
  }
  if (p.startsWith("/api/flows") && method === "POST") {
    return { flow: { id: "flow_new_" + Date.now() } };
  }
  if (p.startsWith("/api/flows")) {
    return { flows: mockFlows };
  }

  // ── Actions ──
  if (p.match(/\/api\/actions\/[^/?]+$/) && method === "PUT") {
    return { success: true };
  }
  if (p.match(/\/api\/actions\/[^/?]+$/)) {
    const act = mockActions[0];
    return act;
  }
  if (p === "/api/actions" && method === "POST") {
    return { id: "act_new_" + Date.now() };
  }
  if (p.startsWith("/api/actions")) {
    return { actions: mockActions };
  }

  // ── Knowledge ──
  if (p.startsWith("/knowledge/sources") && p.includes("/pages")) {
    return { data: [] };
  }
  if (p.match(/\/knowledge\/sources\/[^/?]+$/) && method === "DELETE") {
    return { success: true };
  }
  if (p.startsWith("/knowledge/sources")) {
    return { data: mockKnowledgeSources };
  }
  if (p === "/knowledge/website" && method === "POST") {
    return { success: true, source: { id: "ks_new_" + Date.now(), status: "pending" } };
  }
  if (p === "/knowledge/manual-qna" && method === "POST") {
    return { success: true };
  }
  if (p.startsWith("/knowledge/qna") && method === "POST") {
    return { success: true };
  }
  if (p.startsWith("/knowledge/qna")) {
    return { data: [] };
  }
  if (p === "/knowledge/csv-import" && method === "POST") {
    return { success: true };
  }
  if (p === "/knowledge/zendesk" && method === "POST") {
    return { success: true };
  }
  if (p === "/api/knowledge/chat" && method === "POST") {
    return { response: "Based on our documentation, I can help you with that! Here's what I found..." };
  }
  if (p.match(/\/knowledge\/pages\/[^/?]+$/) && method === "DELETE") {
    return { success: true };
  }

  // ── Integrations ──
  if (p.match(/\/api\/integrations\/[^/]+\/connect/) && method === "POST") {
    return { success: true };
  }
  if (p.match(/\/api\/integrations\/[^/]+\/disconnect/) && method === "POST") {
    return { success: true };
  }
  if (p.match(/\/api\/integrations\/[^/]+\/test/) && method === "POST") {
    return { status: "ok" };
  }
  if (p === "/api/integrations/wordpress/snippet") {
    return { snippet: '<script src="https://widget.forefront.ai/loader.js" data-project="demo"></script>' };
  }
  if (p.startsWith("/api/integrations")) {
    return { integrations: mockIntegrations };
  }

  // ── Billing ──
  if (p === "/billing/status") {
    return mockBillingStatus;
  }
  if (p === "/billing/subscribe" && method === "POST") {
    return { checkoutUrl: "#demo-checkout" };
  }

  // ── Channels ──
  if (p.match(/\/api\/channels\/[^/]+\/settings$/) && method === "PUT") {
    return { success: true };
  }
  if (p === "/api/channels/settings") {
    return {
      data: [
        { channel_type: "web", auto_reply: true, tone: "professional", reply_delay_seconds: 0, business_hours_only: false, timezone: "America/New_York", welcome_message: "Hi! How can we help?", fallback_message: "Our team will get back to you shortly.", max_reply_length: 500 },
        { channel_type: "email", auto_reply: false, tone: "professional", reply_delay_seconds: 0, business_hours_only: false, timezone: "America/New_York" },
        { channel_type: "whatsapp", auto_reply: false, tone: "friendly", reply_delay_seconds: 0, business_hours_only: false, timezone: "America/New_York" },
        { channel_type: "instagram", auto_reply: false, tone: "casual", reply_delay_seconds: 0, business_hours_only: false, timezone: "America/New_York" },
        { channel_type: "messenger", auto_reply: false, tone: "professional", reply_delay_seconds: 0, business_hours_only: false, timezone: "America/New_York" },
      ]
    };
  }
  if (p.startsWith("/api/channels/email")) {
    if (method === "POST") return { success: true, url: "#demo-oauth" };
    if (method === "DELETE") return { success: true };
    return { data: mockEmailConnections };
  }

  // ── Social ──
  if (p.startsWith("/api/social/accounts") && p.includes("auth-url")) {
    return { url: "#demo-oauth" };
  }
  if (p.startsWith("/api/social/accounts") && (method === "POST" || method === "DELETE")) {
    return { success: true };
  }
  if (p.startsWith("/api/social/accounts")) {
    return { data: mockSocialAccounts };
  }

  // ── Domains ──
  if (p.startsWith("/api/domains/widget") && method === "POST") {
    return { domain: { id: "dom_new_" + Date.now() } };
  }
  if (p.match(/\/api\/domains\/widget\/[^/]+\/verify/) && method === "POST") {
    return { verified: true };
  }
  if (p.match(/\/api\/domains\/widget\/[^/]+$/) && method === "DELETE") {
    return { success: true };
  }
  if (p.startsWith("/api/domains/widget")) {
    return { domains: mockDomains.widget };
  }
  if (p.startsWith("/api/domains/custom") && method === "POST") {
    return { domain: { id: "dom_new_" + Date.now() } };
  }
  if (p.match(/\/api\/domains\/custom\/[^/]+\/verify/) && method === "POST") {
    return { verified: true };
  }
  if (p.match(/\/api\/domains\/custom\/[^/]+$/) && method === "DELETE") {
    return { success: true };
  }
  if (p.startsWith("/api/domains/custom")) {
    return { domains: mockDomains.custom };
  }
  if (p.startsWith("/api/domains/email") && method === "POST") {
    return { domain: { id: "dom_new_" + Date.now() } };
  }
  if (p.match(/\/api\/domains\/email\/[^/]+\/verify/) && method === "POST") {
    return { verified: true };
  }
  if (p.match(/\/api\/domains\/email\/[^/]+$/) && method === "DELETE") {
    return { success: true };
  }
  if (p.startsWith("/api/domains/email")) {
    return { domains: mockDomains.email };
  }

  // ── Agents ──
  if (p.match(/\/agents\/[^/]+\/config$/) && method === "PUT") {
    return { success: true };
  }

  // ── Flows stats ──
  if (p.startsWith("/api/flows/stats")) {
    return {
      total_flows: mockFlows.length,
      active_flows: mockFlows.filter(f => f.is_active).length,
      total_executions: mockFlows.reduce((s, f) => s + (f.execution_count || 0), 0),
      avg_engagement: 34.7,
    };
  }

  // Catch-all for unknown GETs
  return null;
}
