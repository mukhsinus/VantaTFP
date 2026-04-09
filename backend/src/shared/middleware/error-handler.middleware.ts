import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Verbose error handler for debugging: logs full error and returns message + stack in the body.
 * Replaces structured envelopes while diagnosing 500s.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (error: Error & { statusCode?: number }, _request: FastifyRequest, reply: FastifyReply) => {
      console.error('FULL ERROR:', error);
      console.error('STACK:', error.stack);

      const statusCode = error.statusCode || 500;

      return reply.status(statusCode).send({
        message: error.message,
        stack: error.stack,
      });
    }
  );
}
