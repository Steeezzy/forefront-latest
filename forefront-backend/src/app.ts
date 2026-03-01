// Disable strict SSL verification for local development/proxies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
import rawBody from 'fastify-raw-body';

dotenv.config();

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
    origin: true,
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
import { lyroRoutes } from './modules/lyro/lyro.routes.js';
import { copilotRoutes } from './modules/copilot/copilot.routes.js';
import { socialRoutes } from './modules/social/social.routes.js';
import { shopifyRoutes } from './modules/shopify/shopify.routes.js';
import { domainRoutes } from './modules/domains/domain.routes.js';
import { integrationRoutes } from './modules/integrations/integration.routes.js';
import { channelRoutes } from './modules/channels/channel.routes.js';

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
app.register(lyroRoutes, { prefix: '/api/lyro' });
app.register(copilotRoutes, { prefix: '/api/copilot' });

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
    return { status: 'ok', message: 'Forefront Backend is running' };
});

export default app;
