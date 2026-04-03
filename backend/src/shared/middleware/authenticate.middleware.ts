import { FastifyRequest, FastifyReply } from 'fastify';
import { ApplicationError } from '../utils/application-error.js';

/**
 * Verifies the JWT attached to the request and populates request.user.
 * Registered as a Fastify decorator so controllers can reference it by name.
 */
export async function authenticateMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    const error = ApplicationError.unauthorized('Invalid or expired token');
    reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      message: error.message,
    });
  }
}
