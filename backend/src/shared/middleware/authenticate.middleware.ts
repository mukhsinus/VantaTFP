import { FastifyRequest, FastifyReply } from 'fastify';
import { ApplicationError } from '../utils/application-error.js';

/**
 * Verifies the JWT attached to the request and populates request.user.
 * Registered as a Fastify decorator so controllers can reference it by name.
 */
export async function authenticateMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw ApplicationError.unauthorized('Invalid or expired token');
  }
}
