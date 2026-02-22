console.log('app.ts: Start of file');
import Fastify from 'fastify';
import * as dotenv from 'dotenv';
import rawBody from 'fastify-raw-body';
console.log('app.ts: Imports done, configuring dotenv');
dotenv.config();
console.log('app.ts: Creating Fastify instance');
const app = Fastify({
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
    origin: true, // Allow any origin for dev (reflects request origin)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});
app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'supersecret-cookie-signer', // Use env in prod
    parseOptions: {}
});
import { clerkPlugin } from '@clerk/fastify';
app.register(clerkPlugin, {
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY
});
import { authRoutes } from './modules/auth/auth.routes.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import { billingRoutes } from './modules/billing/api/billing.routes.js';
import { knowledgeRoutes } from './modules/knowledge/knowledge.routes.js';
import { agentRoutes } from './modules/agent/agent.routes.js';
import { voiceRoutes } from './modules/voice/voice.routes.js';
import { languageRoutes } from './modules/language/language.routes.js';
import { teamRoutes, inviteRoutes } from './modules/team/team.routes.js';
import { inboxRoutes } from './modules/inbox/inbox.routes.js';
import { widgetRoutes, publicWidgetRoutes } from './modules/widget/widget.routes.js';
import { visitorRoutes } from './modules/visitor/visitor.routes.js';
import { copilotRoutes } from './modules/copilot/copilot.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { cannedResponseRoutes } from './modules/canned-responses/canned-response.routes.js';
// Register routes
app.register(authRoutes, { prefix: '/auth' });
app.register(inviteRoutes, { prefix: '/auth' });
app.register(chatRoutes, { prefix: '/api' }); // Legacy chat operations
app.register(billingRoutes, { prefix: '/billing' });
app.register(knowledgeRoutes, { prefix: '/knowledge' });
app.register(agentRoutes, { prefix: '/agents' });
app.register(voiceRoutes, { prefix: '/voice' });
app.register(languageRoutes, { prefix: '/language' });
// New modules
app.register(teamRoutes, { prefix: '/team' });
app.register(inboxRoutes, { prefix: '/inbox' });
app.register(widgetRoutes, { prefix: '/widget' });
app.register(visitorRoutes, { prefix: '/visitors' });
app.register(copilotRoutes, { prefix: '/copilot' });
app.register(analyticsRoutes, { prefix: '/analytics' });
app.register(cannedResponseRoutes, { prefix: '/macros' });
// Public routes (no auth required)
app.register(publicWidgetRoutes);
app.get('/', async (request, reply) => {
    return { status: 'ok', message: 'Forefront Backend is running' };
});
export default app;
