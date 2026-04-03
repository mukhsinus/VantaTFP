import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '../types/common.types.js';
import { ApplicationError } from '../utils/application-error.js';

/**
 * Returns a preHandler that enforces role-based access control.
 * Usage in a route: preHandler: [fastify.authenticate, requireRoles('ADMIN', 'MANAGER')]
 */
export function requireRoles(...allowedRoles: Role[]) {
  return async function roleGuard(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const user = request.user;

    if (!user) {
      const error = ApplicationError.unauthorized();
      reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        message: error.message,
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      const error = ApplicationError.forbidden(
        `Role '${user.role}' is not permitted to access this resource`
      );
      reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  };
}
