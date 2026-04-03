import { Pool } from 'pg';
import { AuthenticatedUser } from './common.types.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Pool;
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

/**
 * Narrows the @fastify/jwt payload type so request.user is AuthenticatedUser
 * everywhere in the codebase without manual casts.
 */
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthenticatedUser;
    user: AuthenticatedUser;
  }
}
