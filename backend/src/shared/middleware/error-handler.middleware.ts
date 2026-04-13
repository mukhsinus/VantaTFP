import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { errorEnvelope } from '../utils/response.js';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (error: Error & { statusCode?: number; code?: string }, _request: FastifyRequest, reply: FastifyReply) => {
      console.error('FULL ERROR:', error);
      console.error('STACK:', error.stack);

      const statusCode = error.statusCode || 500;
      const code = error.code ?? (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');

      return reply.status(statusCode).send(errorEnvelope(code, error.message));
    }
  );
}
