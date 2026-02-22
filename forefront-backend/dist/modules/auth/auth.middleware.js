import { getAuth } from '@clerk/fastify';
export async function authenticate(req, reply) {
    const { userId } = getAuth(req);
    if (!userId) {
        return reply.code(401).send({ message: 'Unauthorized' });
    }
    // Attach user to request (compatible with existing code)
    req.user = {
        userId: userId,
        workspaceId: 'default-workspace', // TODO: Fetch real workspace from metadata or DB
        email: '', // Email not available directly in minimal auth object, fetch if needed
    };
}
