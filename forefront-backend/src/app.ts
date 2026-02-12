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
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'supersecret-cookie-signer', // Use env in prod
    parseOptions: {}
});

import { authRoutes } from './modules/auth/auth.routes.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import { billingRoutes } from './modules/billing/api/billing.routes.js';

app.register(authRoutes, { prefix: '/auth' });
app.register(chatRoutes, { prefix: '/api' });
app.register(billingRoutes, { prefix: '/billing' });

app.get('/', async (request, reply) => {
    return { status: 'ok', message: 'Forefront Backend is running' };
});

export default app;
