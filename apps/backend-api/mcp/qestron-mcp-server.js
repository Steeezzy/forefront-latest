#!/usr/bin/env node
/**
 * Qestron MCP Server
 * ──────────────────
 * Exposes Qestron backend capabilities as MCP tools so Hermes can:
 *   - Trigger memory syncs, BI reports, churn alerts
 *   - Run Claude Managed Agent sessions on demand
 *   - Get workspace health across all clients
 *   - Send client notifications
 *   - Audit partner access tokens
 *
 * Add to ~/.hermes/config.yaml:
 *   mcp_servers:
 *     qestron:
 *       command: node
 *       args:
 *         - /Users/karthikj/Downloads/forefrontthemeclone/forefront-backend/mcp/qestron-mcp-server.js
 *       enabled: true
 *       env:
 *         QESTRON_API_URL: http://localhost:3001
 *         QESTRON_ADMIN_TOKEN: <your-admin-token>
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ── Config ────────────────────────────────────────────────────────────────────
const API_URL   = process.env.QESTRON_API_URL   || 'http://localhost:3001';
const API_TOKEN = process.env.QESTRON_ADMIN_TOKEN || '';
const TIMEOUT_MS = 30_000;

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'x-mcp-client': 'hermes',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      return { error: true, status: res.status, message: data?.error?.message || data?.message || text };
    }
    return data;
  } catch (err) {
    return { error: true, message: err.message };
  } finally {
    clearTimeout(timer);
  }
}

// ── Format helper ─────────────────────────────────────────────────────────────
function fmt(data) {
  return JSON.stringify(data, null, 2);
}

// ── Tool definitions ──────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'qestron_workspace_health',
    description: 'Get health summary for all Qestron workspaces. Shows active clients, churn risk counts, and system status. Use this for the daily briefing.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'Optional: single workspace ID. If omitted, returns all workspaces summary.',
        },
      },
    },
  },
  {
    name: 'qestron_trigger_memory_sync',
    description: 'Trigger the Claude Managed Agent memory sync for a workspace. Processes pending interaction logs, updates customer profiles, recalculates churn risk scores. Run this every 5 minutes.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'Workspace ID to sync. If omitted, syncs all active workspaces.',
        },
      },
    },
  },
  {
    name: 'qestron_get_churn_alerts',
    description: 'Get customers at risk of churning across all workspaces. Returns a list of high-risk customers with names, contact info, risk scores, and recommended actions.',
    inputSchema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          description: 'Minimum risk score to include (0-100). Default: 70.',
          default: 70,
        },
        workspace_id: {
          type: 'string',
          description: 'Optional: filter to a specific workspace.',
        },
        limit: {
          type: 'number',
          description: 'Max results to return. Default: 20.',
          default: 20,
        },
      },
    },
  },
  {
    name: 'qestron_get_bi_report',
    description: 'Get the latest Business Intelligence report for a workspace. Includes top questions, peak hours, revenue at risk, and AI recommendations. Used in the daily morning briefing.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'Workspace ID. If omitted, returns aggregate across all workspaces.',
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format. Defaults to today.',
        },
      },
    },
  },
  {
    name: 'qestron_run_managed_agent',
    description: 'Run a Claude Managed Agent task on demand. Use this when you need AI reasoning on Qestron data — e.g. "analyze these call logs", "draft a win-back SMS", "audit this workspace config".',
    inputSchema: {
      type: 'object',
      required: ['type', 'prompt'],
      properties: {
        type: {
          type: 'string',
          enum: ['text', 'json'],
          description: '"text" for conversational output, "json" for structured data extraction.',
        },
        prompt: {
          type: 'string',
          description: 'The full instruction/prompt to send to the Claude Managed Agent.',
        },
        workspace_id: {
          type: 'string',
          description: 'Optional workspace context to include.',
        },
        title: {
          type: 'string',
          description: 'Optional label for this agent run (shows in logs).',
        },
      },
    },
  },
  {
    name: 'qestron_trigger_pat_audit',
    description: 'Audit a Partner Access Token (PAT) session. Checks permissions, reviews audit log for anomalies, returns a security summary. Use when a partner session looks suspicious.',
    inputSchema: {
      type: 'object',
      required: ['pat_id'],
      properties: {
        pat_id: {
          type: 'string',
          description: 'The PAT ID or pat_code (e.g. pat_7xK9mN2p) to audit.',
        },
      },
    },
  },
  {
    name: 'qestron_send_client_notification',
    description: 'Send a notification to a Qestron client workspace. Can deliver via their configured channels (in-app, SMS, email). Use for win-back alerts, setup completion, etc.',
    inputSchema: {
      type: 'object',
      required: ['workspace_id', 'message'],
      properties: {
        workspace_id: {
          type: 'string',
          description: 'The workspace ID of the client to notify.',
        },
        message: {
          type: 'string',
          description: 'The notification message to send.',
        },
        channel: {
          type: 'string',
          enum: ['in_app', 'sms', 'email'],
          description: 'Delivery channel. Default: in_app.',
          default: 'in_app',
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high'],
          description: 'Notification priority. Default: normal.',
          default: 'normal',
        },
      },
    },
  },
  // ── Cloud Hosting Tools ──────────────────────────────────────────────────────
  {
    name: 'qestron_list_domains',
    description: 'List all domains for a workspace including SSL status, auto-renew settings, and DNS records.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID to list domains for.' },
      },
      required: ['workspace_id'],
    },
  },
  {
    name: 'qestron_list_mailboxes',
    description: 'List all email mailboxes for a workspace with storage usage.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
      },
      required: ['workspace_id'],
    },
  },
  {
    name: 'qestron_create_mailbox',
    description: 'Create a new email mailbox for a workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
        local_part: { type: 'string', description: 'The part before @, e.g. "support".' },
        domain: { type: 'string', description: 'The domain, e.g. "mystore.com".' },
        display_name: { type: 'string', description: 'Display name for the mailbox.' },
        password: { type: 'string', description: 'Initial password for the mailbox.' },
        storage_limit_gb: { type: 'number', description: 'Storage limit in GB (default: 5).' },
      },
      required: ['workspace_id', 'local_part', 'domain', 'display_name', 'password'],
    },
  },
  {
    name: 'qestron_get_file_storage_usage',
    description: 'Get file storage usage stats for a workspace (file count, total bytes used).',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
      },
      required: ['workspace_id'],
    },
  },
  // ── Website Builder Tools ────────────────────────────────────────────────────
  {
    name: 'qestron_list_pages',
    description: 'List all website pages for a workspace. Returns titles, slugs, status (draft/published), and view counts.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
      },
      required: ['workspace_id'],
    },
  },
  {
    name: 'qestron_create_page',
    description: 'Create a new website page for a workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
        title: { type: 'string', description: 'Page title.' },
        slug: { type: 'string', description: 'URL slug, e.g. "/about".' },
      },
      required: ['workspace_id', 'title', 'slug'],
    },
  },
  {
    name: 'qestron_publish_page',
    description: 'Publish a draft website page to make it publicly accessible.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
        page_id: { type: 'string', description: 'Page UUID to publish.' },
      },
      required: ['workspace_id', 'page_id'],
    },
  },
  // ── Store Tools ──────────────────────────────────────────────────────────────
  {
    name: 'qestron_get_store_stats',
    description: 'Get store stats for a workspace: total revenue, order count, product count, and average order value.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
      },
      required: ['workspace_id'],
    },
  },
  {
    name: 'qestron_list_products',
    description: 'List products in a workspace store. Optionally filter by category, status, or search term.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
        category: { type: 'string', description: 'Filter by category (optional).' },
        status: { type: 'string', description: 'Filter by status: active, draft, archived (optional).' },
        search: { type: 'string', description: 'Search term for product name (optional).' },
      },
      required: ['workspace_id'],
    },
  },
  {
    name: 'qestron_add_product',
    description: 'Add a new product to a workspace store.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
        name: { type: 'string', description: 'Product name.' },
        price: { type: 'number', description: 'Price in INR (₹).' },
        category: { type: 'string', description: 'Product category.' },
        stock: { type: 'number', description: 'Initial stock quantity.' },
        description: { type: 'string', description: 'Product description (optional).' },
        sku: { type: 'string', description: 'SKU code (optional).' },
      },
      required: ['workspace_id', 'name', 'price'],
    },
  },
  {
    name: 'qestron_list_orders',
    description: 'List orders for a workspace store. Optionally filter by payment status.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
        status: { type: 'string', description: 'Filter by payment status: pending, paid, failed, refunded (optional).' },
      },
      required: ['workspace_id'],
    },
  },
  {
    name: 'qestron_adjust_inventory',
    description: 'Adjust stock quantity for a product in the store.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
        product_id: { type: 'string', description: 'Product UUID.' },
        adjustment: { type: 'number', description: 'Quantity to add (positive) or subtract (negative).' },
        reason: { type: 'string', description: 'Reason: received, sold, damaged, returned.' },
      },
      required: ['workspace_id', 'product_id', 'adjustment', 'reason'],
    },
  },
  // ── App Gateway Tools ────────────────────────────────────────────────────────
  {
    name: 'qestron_list_apps',
    description: 'List all App Gateway apps created in a workspace. Returns app URL and status.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
      },
      required: ['workspace_id'],
    },
  },
  {
    name: 'qestron_create_app',
    description: 'Create a new App Gateway app for a workspace. Generates the app URL and auth token.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace ID.' },
        workspace_slug: { type: 'string', description: 'Workspace slug for URL generation.' },
        name: { type: 'string', description: 'App name.' },
        slug: { type: 'string', description: 'App slug for URL, e.g. "staff-portal".' },
        template: { type: 'string', description: 'Template: hospital, restaurant, retail, school, custom.' },
        description: { type: 'string', description: 'App description.' },
        features: { type: 'array', items: { type: 'string' }, description: 'List of features to enable.' },
        roles: { type: 'array', items: { type: 'string' }, description: 'User roles, e.g. ["Admin", "Staff"].' },
      },
      required: ['workspace_id', 'workspace_slug', 'name', 'slug', 'template'],
    },
  },
  {
    name: 'qestron_validate_app_token',
    description: 'Validate an App Gateway token. Returns whether the token is valid and the app config if so.',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'The JWT token to validate.' },
      },
      required: ['token'],
    },
  },
  // ── Support Tools ────────────────────────────────────────────────────────────
  {
    name: 'qestron_get_support_stats',
    description: 'Get support portal stats: open ticket count, resolved today, avg response time, CSAT score.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'qestron_list_tickets',
    description: 'List support tickets, optionally filtered by status or priority.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status: open, pending, resolved, closed.' },
        priority: { type: 'string', description: 'Filter by priority: urgent, high, medium, low.' },
      },
    },
  },
  {
    name: 'qestron_get_managed_agent_runs',
    description: 'Get recent Claude Managed Agent run history. Shows session IDs, kinds (text/json), status, duration, and outputs. Useful for debugging or reviewing what agents have done.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'Filter runs by workspace ID.',
        },
        limit: {
          type: 'number',
          description: 'Number of recent runs to return. Default: 10.',
          default: 10,
        },
      },
    },
  },
];

// ── Tool handlers ─────────────────────────────────────────────────────────────
async function handleTool(name, args) {
  switch (name) {

    case 'qestron_workspace_health': {
      const path = args.workspace_id
        ? `/api/mcp/workspace-health?workspace_id=${encodeURIComponent(args.workspace_id)}`
        : '/api/mcp/workspace-health';
      const data = await api('GET', path);
      return fmt(data);
    }

    case 'qestron_trigger_memory_sync': {
      const data = await api('POST', '/api/mcp/memory-sync', {
        workspace_id: args.workspace_id || null,
      });
      return fmt(data);
    }

    case 'qestron_get_churn_alerts': {
      const params = new URLSearchParams({
        threshold: String(args.threshold ?? 70),
        limit: String(args.limit ?? 20),
      });
      if (args.workspace_id) params.set('workspace_id', args.workspace_id);
      const data = await api('GET', `/api/mcp/churn-alerts?${params}`);
      return fmt(data);
    }

    case 'qestron_get_bi_report': {
      const params = new URLSearchParams();
      if (args.workspace_id) params.set('workspace_id', args.workspace_id);
      if (args.date) params.set('date', args.date);
      const data = await api('GET', `/api/mcp/bi-report?${params}`);
      return fmt(data);
    }

    case 'qestron_run_managed_agent': {
      const data = await api('POST', '/api/mcp/run-managed-agent', {
        type: args.type,
        prompt: args.prompt,
        workspace_id: args.workspace_id || null,
        title: args.title || `Hermes task — ${new Date().toISOString()}`,
      });
      return fmt(data);
    }

    case 'qestron_trigger_pat_audit': {
      const data = await api('POST', '/api/mcp/pat-audit', {
        pat_id: args.pat_id,
      });
      return fmt(data);
    }

    case 'qestron_send_client_notification': {
      const data = await api('POST', '/api/mcp/notify', {
        workspace_id: args.workspace_id,
        message: args.message,
        channel: args.channel || 'in_app',
        priority: args.priority || 'normal',
      });
      return fmt(data);
    }

    case 'qestron_get_managed_agent_runs': {
      const params = new URLSearchParams({
        limit: String(args.limit ?? 10),
      });
      if (args.workspace_id) params.set('workspace_id', args.workspace_id);
      const data = await api('GET', `/api/mcp/managed-agent-runs?${params}`);
      return fmt(data);
    }

    // ── Cloud Hosting Handlers ─────────────────────────────────────────────────
    case 'qestron_list_domains': {
      const data = await api('GET', `/api/domains/custom?workspace_id=${encodeURIComponent(args.workspace_id)}`);
      return fmt(data);
    }

    case 'qestron_list_mailboxes': {
      const data = await api('GET', `/api/cloud/mailboxes?workspace_id=${encodeURIComponent(args.workspace_id)}`);
      return fmt(data);
    }

    case 'qestron_create_mailbox': {
      const data = await api('POST', '/api/cloud/mailboxes', {
        workspace_id: args.workspace_id,
        localPart: args.local_part,
        domain: args.domain,
        displayName: args.display_name,
        password: args.password,
        storageLimitGb: args.storage_limit_gb || 5,
      });
      return fmt(data);
    }

    case 'qestron_get_file_storage_usage': {
      const data = await api('GET', `/api/cloud/files/usage?workspace_id=${encodeURIComponent(args.workspace_id)}`);
      return fmt(data);
    }

    // ── Website Builder Handlers ───────────────────────────────────────────────
    case 'qestron_list_pages': {
      const data = await api('GET', `/api/websites?workspace_id=${encodeURIComponent(args.workspace_id)}`);
      return fmt(data);
    }

    case 'qestron_create_page': {
      const data = await api('POST', '/api/websites', {
        workspace_id: args.workspace_id,
        title: args.title,
        slug: args.slug,
      });
      return fmt(data);
    }

    case 'qestron_publish_page': {
      const data = await api('PATCH', `/api/websites/${encodeURIComponent(args.page_id)}/publish`);
      return fmt(data);
    }

    // ── Store Handlers ─────────────────────────────────────────────────────────
    case 'qestron_get_store_stats': {
      const data = await api('GET', `/api/store/stats?workspace_id=${encodeURIComponent(args.workspace_id)}`);
      return fmt(data);
    }

    case 'qestron_list_products': {
      const params = new URLSearchParams({ workspace_id: args.workspace_id });
      if (args.category) params.set('category', args.category);
      if (args.status) params.set('status', args.status);
      if (args.search) params.set('search', args.search);
      const data = await api('GET', `/api/store/products?${params}`);
      return fmt(data);
    }

    case 'qestron_add_product': {
      const data = await api('POST', '/api/store/products', {
        workspace_id: args.workspace_id,
        name: args.name,
        price: args.price,
        category: args.category || 'Other',
        stock: args.stock || 0,
        description: args.description || '',
        sku: args.sku || '',
      });
      return fmt(data);
    }

    case 'qestron_list_orders': {
      const params = new URLSearchParams({ workspace_id: args.workspace_id });
      if (args.status) params.set('status', args.status);
      const data = await api('GET', `/api/store/orders?${params}`);
      return fmt(data);
    }

    case 'qestron_adjust_inventory': {
      const data = await api('POST', '/api/store/inventory/adjust', {
        workspace_id: args.workspace_id,
        productId: args.product_id,
        adjustment: args.adjustment,
        reason: args.reason,
      });
      return fmt(data);
    }

    // ── App Gateway Handlers ───────────────────────────────────────────────────
    case 'qestron_list_apps': {
      const data = await api('GET', `/api/apps?workspace_id=${encodeURIComponent(args.workspace_id)}`);
      return fmt(data);
    }

    case 'qestron_create_app': {
      const data = await api('POST', '/api/apps', {
        workspace_id: args.workspace_id,
        workspace_slug: args.workspace_slug,
        name: args.name,
        slug: args.slug,
        template: args.template,
        description: args.description || '',
        features: args.features || [],
        roles: args.roles || ['Admin', 'Staff'],
      });
      return fmt(data);
    }

    case 'qestron_validate_app_token': {
      const data = await api('POST', '/api/apps/validate-token', { token: args.token });
      return fmt(data);
    }

    // ── Support Handlers ───────────────────────────────────────────────────────
    case 'qestron_get_support_stats': {
      const data = await api('GET', '/api/support/stats');
      return fmt(data);
    }

    case 'qestron_list_tickets': {
      const params = new URLSearchParams();
      if (args.status) params.set('status', args.status);
      if (args.priority) params.set('priority', args.priority);
      const data = await api('GET', `/api/support/tickets?${params}`);
      return fmt(data);
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ── Server bootstrap ──────────────────────────────────────────────────────────
const server = new Server(
  { name: 'qestron', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, args || {});
    return {
      content: [{ type: 'text', text: result }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
