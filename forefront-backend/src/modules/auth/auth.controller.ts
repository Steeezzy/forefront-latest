import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService, loginSchema, registerSchema } from './auth.service.js';
import { z } from 'zod';

const authService = new AuthService();

export class AuthController {
    async register(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = registerSchema.parse(req.body);
            const result = await authService.register(body);

            // Set HttpOnly Cookie
            reply.setCookie('token', result.token, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // true in prod
                sameSite: 'lax', // or 'none' if cross-domain in prod
                maxAge: 7 * 24 * 60 * 60, // 7 days
            });

            return reply.code(201).send({ user: result.user, workspace: result.workspace });
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                return reply.code(400).send({ message: 'Validation error', errors: e.issues });
            }
            return reply.code(400).send({ message: e.message });
        }
    }

    async login(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = loginSchema.parse(req.body);
            const result = await authService.login(body);

            // Set HttpOnly Cookie
            reply.setCookie('token', result.token, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60,
            });

            return reply.send({ user: result.user, workspace: result.workspace });
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                return reply.code(400).send({ message: 'Validation error', errors: e.issues });
            }
            return reply.code(401).send({ message: e.message });
        }
    }

    async me(req: FastifyRequest, reply: FastifyReply) {
        // User is attached by middleware
        const user = (req as any).user;
        if (!user) return reply.code(401).send({ message: 'Not authenticated' });

        // Return minimal user info. In real app might fetch fresh from DB.
        // Returning ID and email from token is fast.
        // Context expects: { user: { id, email, name? } }
        // AuthService.login returns user { id, email }. Token has userId.

        // Let's fetch fresh user to be safe
        try {
            // Determine how to get user details. For now, rely on token payload if it has email, 
            // but verifyToken only decoded userId and workspaceId.
            // We need to fetch the user from DB.
            // But for speed, let's just return what we have if we trust the token, 
            // OR fetch. Fetching is safer.
            // Since I don't want to add getUserById to service right now, let's just assume token is valid.
            // WAIT: Token only has userId. Front end needs email.
            // I MUST fetch user.

            // ... importing db query ... (need to refactor or use service)
            // I will add getUserById to AuthService.

            const fullUser = await authService.getUserById(user.userId);
            if (!fullUser) return reply.code(401).send({ message: 'User not found' });

            return reply.send({ user: fullUser });

        } catch (e) {
            return reply.code(500).send({ message: 'Server error' });
        }
    }

    async logout(req: FastifyRequest, reply: FastifyReply) {
        reply.clearCookie('token', { path: '/' });
        return reply.send({ message: 'Logged out' });
    }
}
