import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '../types/common.types.js';
import { ApplicationError } from '../utils/application-error.js';

/**
 * Returns a preHandler that enforces role-based access control.
 * Usage in a route: preHandler: [fastify.authenticate, requireRoles('ADMIN', 'MANAGER')]
 */
export function requireRoles(...allowedRoles: Role[]) {
  if (allowedRoles.length === 0) {
    throw new Error('requireRoles() must receive at least one role');
  }

  return async function roleGuard(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    const user = request.user;

    if (!user) {
      throw ApplicationError.unauthorized();
    }

    if (!allowedRoles.includes(user.role)) {
      throw ApplicationError.forbidden(
        `Role '${user.role}' is not permitted to access this resource`
      );
    }
  };
}

/**
 * Validates that user belongs to the requested tenant context.
 * Prevents users from accessing other tenants' data.
 * 
 * Usage: preHandler: [fastify.authenticate, validateTenantContext()]
 */
export function validateTenantContext() {
  return async function tenantValidator(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    const user = request.user;
    const params = (request.params ?? {}) as { tenantId?: string };
    const requestedTenantId = params.tenantId ?? user?.tenantId;

    if (!user) {
      throw ApplicationError.unauthorized();
    }

    // Strict isolation: all protected tenant context must match JWT tenant.
    if (requestedTenantId && requestedTenantId !== user.tenantId) {
      throw ApplicationError.forbidden(
        'You cannot access data from another tenant'
      );
    }
  };
}
