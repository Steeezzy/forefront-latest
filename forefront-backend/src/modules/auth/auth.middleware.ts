import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../../utils/jwt.js';

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
    const token = req.cookies.token;

    if (!token) {
        return reply.code(401).send({ message: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return reply.code(401).send({ message: 'Invalid token' });
    }

    // Attach user to request
    (req as any).user = decoded;
}
