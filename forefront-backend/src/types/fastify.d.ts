import { FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    auth: {
      userId: string | null;
      sessionId: string | null;
      getToken: (options?: { template?: string }) => Promise<string | null>;
      claims: any;
    };
    user?: {
      userId: string;
      workspaceId: string;
      email: string;
    };
  }
}
