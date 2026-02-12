import type { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';
import { authenticate } from './auth.middleware.js';

const authController = new AuthController();

export async function authRoutes(app: FastifyInstance) {
    app.post('/register', authController.register);
    app.post('/login', authController.login);
    app.post('/logout', authController.logout);

    app.get('/me', { preHandler: [authenticate] }, authController.me);
}
