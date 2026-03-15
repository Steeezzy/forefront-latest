// Initialize Fastify App
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
import rawBody from 'fastify-raw-body';

dotenv.config();

import { pool } from './config/db.js';

const app: FastifyInstance = Fastify({
  logger: true
});

// Raw Body for Webhooks (Stripe/Razorpay signature verification)
app.register(rawBody, {
  field: 'rawBody',
  global: false,
  encoding: 'utf8',
  runFirst: true,
});

import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    try {
      const url = new URL(origin);
      if (
        url.hostname.endsWith('.myshopify.com') || 
        url.hostname.endsWith('.shopify.com') ||
        origin === process.env.FRONTEND_URL ||
        origin === 'http://localhost:3000' ||
        origin === 'http://localhost:3001'
      ) {
        return cb(null, true);
      }
      return cb(null, false);
    } catch {
      return cb(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

app.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'supersecret-cookie-signer', // Use env in prod
  parseOptions: {}
});

// Override default JSON parser to tolerate empty bodies often sent by frontend on DELETE requests
app.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body: string, done) {
  try {
    if (!body || body.trim() === '') {
      return done(null, {});
    }
    done(null, JSON.parse(body));
  } catch (err: any) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

import { authRoutes } from './modules/auth/auth.routes.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import { billingRoutes } from './modules/billing/api/billing.routes.js';
import { knowledgeRoutes } from './modules/knowledge/knowledge.routes.js';
import { agentRoutes } from './modules/agent/agent.routes.js';
import { actionRoutes } from './modules/action/action.routes.js';
import { flowRoutes } from './modules/flow/flow.routes.js';
import { kbRoutes } from './modules/kb/kb.routes.js';
import { ticketRoutes } from './modules/tickets/ticket.routes.js';
import { inboxRoutes } from './modules/inbox/inbox.routes.js';
import { workflowRoutes } from './modules/workflow/workflow.routes.js';
import { conversaRoutes } from './modules/conversa/conversa.routes.js';
import { copilotRoutes } from './modules/copilot/copilot.routes.js';
import { socialRoutes } from './modules/social/social.routes.js';
import { shopifyRoutes } from './modules/shopify/shopify.routes.js';
import { domainRoutes } from './modules/domains/domain.routes.js';
import { integrationRoutes } from './modules/integrations/integration.routes.js';
import { channelRoutes } from './modules/channels/channel.routes.js';

import voiceRoutes from './modules/voice/voice.routes.js';
import campaignsRoutes from './modules/campaigns/campaigns.routes.js';
import numbersRoutes from './modules/numbers/numbers.routes.js';
import workspaceRoutes from './modules/workspace/workspace.routes.js';

import { redis } from './config/redis.js';

app.get('/health', async (req, reply) => {
  const status: any = { status: 'ok', timestamp: new Date().toISOString() };
  
  try {
    const dbRes = await pool.query('SELECT 1');
    status.database = { status: 'connected', version: (await pool.query('SELECT version()')).rows[0].version };
  } catch (err: any) {
    status.database = { status: 'error', message: err.message };
  }

  try {
    await redis.get('health_check');
    status.redis = { status: 'connected' };
  } catch (err: any) {
    status.redis = { status: 'error', message: err.message };
  }

  status.env = {
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    REDIS_URL: process.env.REDIS_URL ? 'set' : 'missing',
    SARVAM_API_KEY: process.env.SARVAM_API_KEY ? 'set' : 'missing',
  };

  return status;
});

// Init Shopify event listeners
import './events/shopify.events.js';

app.register(authRoutes, { prefix: '/auth' });
app.register(chatRoutes, { prefix: '/api' });
app.register(billingRoutes, { prefix: '/billing' });
app.register(knowledgeRoutes, { prefix: '/knowledge' });
app.register(knowledgeRoutes, { prefix: '/api/knowledge' });
app.register(agentRoutes, { prefix: '/agents' });
app.register(actionRoutes, { prefix: '/api/actions' });
app.register(flowRoutes, { prefix: '/api/flows' });
app.register(kbRoutes, { prefix: '/api/kb' });
app.register(ticketRoutes, { prefix: '/api/tickets' });
app.register(inboxRoutes, { prefix: '/api/inbox' });
app.register(workflowRoutes, { prefix: '/api/workflows' });
app.register(conversaRoutes, { prefix: '/api/conversa' });
app.register(copilotRoutes, { prefix: '/api/copilot' });

app.register(voiceRoutes, { prefix: '/api/voice-agents' });
app.register(campaignsRoutes, { prefix: '/api/campaigns' });
app.register(numbersRoutes, { prefix: '/api/numbers' });
app.register(workspaceRoutes, { prefix: '/api/workspace' });

// Social routes need rawBody for webhook signature verification.
// fastify-raw-body is already registered globally above with runFirst: true
app.register(socialRoutes, { prefix: '/api/social' });

// Shopify routes — webhooks use rawBody for HMAC verification
app.register(shopifyRoutes, { prefix: '/api/shopify' });

// Domain management routes
app.register(domainRoutes, { prefix: '/api/domains' });

// Integration management routes (all 27 integrations)
app.register(integrationRoutes, { prefix: '/api/integrations' });

// Channel settings, email connections, agent takeover, auto-reply logs
app.register(channelRoutes, { prefix: '/api/channels' });

app.get('/', async (request, reply) => {
  const { shop } = request.query as { shop?: string };
  if (shop) {
    // Normalize shop domain (handle admin URLs like admin.shopify.com/store/xxx)
    let shopDomain = shop;
    if (shopDomain.includes('/store/')) {
      const match = shopDomain.match(/([a-zA-Z0-9-]+\.myshopify\.com)/);
      if (match) shopDomain = match[1];
    }
    if (!shopDomain.includes('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    // Check if this store is already connected
    const existing = await pool.query(
      `SELECT id, is_active, workspace_id FROM shopify_configs WHERE shop_domain = $1 AND is_active = true LIMIT 1`,
      [shopDomain]
    );

    if (existing.rows.length === 0) {
      // NEW INSTALL → redirect to OAuth permissions screen
      const appUrl = process.env.SHOPIFY_APP_URL || `${request.protocol}://${request.hostname}`;
      return reply.redirect(`${appUrl}/api/shopify/install?shop=${encodeURIComponent(shopDomain)}&workspaceId=__auto__${shopDomain.split('.')[0]}`);
    }

    // ALREADY INSTALLED → show the admin page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const workspaceId = existing.rows[0].workspace_id;
    reply.type('text/html').send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Questron Chatbot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0f; color: #e0e0e0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { max-width: 540px; width: 100%; padding: 48px 32px; text-align: center; }
    .logo { width: 64px; height: 64px; background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 16px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: white; font-weight: 700; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #fff; }
    .shop { font-size: 14px; color: #888; margin-bottom: 32px; }
    .status { display: flex; align-items: center; gap: 8px; justify-content: center; margin-bottom: 32px; font-size: 14px; color: #4ade80; }
    .status .dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .card { background: #141420; border: 1px solid #222; border-radius: 12px; padding: 24px; margin-bottom: 16px; text-align: left; }
    .card h3 { font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 12px; }
    .card ol { padding-left: 20px; font-size: 13px; line-height: 2; color: #aaa; }
    .card code { background: #1e1e2e; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #c084fc; }
    .btn { display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 8px; transition: transform 0.15s, box-shadow 0.15s; }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(79,70,229,0.4); }
    .btn-outline { display: inline-block; padding: 10px 24px; border: 1px solid #333; color: #818cf8; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 13px; margin-top: 12px; margin-left: 8px; transition: border-color 0.15s; }
    .btn-outline:hover { border-color: #818cf8; }
    .link { color: #818cf8; text-decoration: none; font-size: 13px; display: block; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">F</div>
    <h1>Questron Chatbot</h1>
    <p class="shop">Connected to <strong>${shopDomain}</strong></p>
    <div class="status"><span class="dot"></span> App installed & running</div>
    <div class="card">
      <h3>Quick Setup</h3>
      <ol>
        <li>Go to <strong>Online Store → Themes → Customize</strong></li>
        <li>Click <strong>App embeds</strong> in the left sidebar</li>
        <li>Toggle on <strong>Questron Chat Widget</strong></li>
        <li>Enter your <strong>Chatbot ID</strong> from the dashboard</li>
        <li>Click <strong>Save</strong></li>
      </ol>
    </div>
    <div>
      <a href="${frontendUrl}/panel/settings/shopify?shop=${encodeURIComponent(shopDomain)}&workspaceId=${workspaceId}" target="_top" class="btn">Open Dashboard →</a>
      <a href="https://${shopDomain}/admin/themes" target="_top" class="btn-outline">Theme Editor</a>
    </div>
    <a href="https://${shopDomain}/admin/themes/current/editor?context=apps" target="_top" class="link">Go directly to App Embeds →</a>
  </div>
</body>
</html>`);
    return;
  }
  return { status: 'ok', message: 'Questron Backend is running' };
});

app.get('/debug/error', async () => {
  throw new Error('Explicit debug error');
});

export default app;
