import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '../types/common.types.js';
import { Permission, roleHasPermission } from '../types/permissions.js';
import { ApplicationError } from '../utils/application-error.js';

/**
 * Returns a preHandler that enforces role-based access control.
 * DEPRECATED: Use requirePermission() for new code - more flexible and maintainable.
 * 
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

/**
 * Permission-based access control (PREFERRED).
 * Checks if user's role has the required permission.
 * More flexible than hardcoded roles - supports custom permissions per application.
 * 
 * Usage: preHandler: [fastify.authenticate, requirePermission('update:task')]
 */
export function requirePermission(...permissions: Permission[]) {
  return async function permissionGuard(
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

    // Check if user's role has any of the required permissions
    const hasPermission = permissions.some(permission =>
      roleHasPermission(user.role, permission)
    );

    if (!hasPermission) {
      const error = ApplicationError.forbidden(
        `Permission denied. Required one of: ${permissions.join(', ')}`
      );
      reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        message: error.message,
      });
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
    reply: FastifyReply
  ): Promise<void> {
    const user = request.user;
    const requestedTenantId = request.params.tenantId ?? request.query.tenantId ?? user?.tenantId;

    if (!user) {
      const error = ApplicationError.unauthorized();
      reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        message: error.message,
      });
      return;
    }

    // User can only access their own tenant (unless they're a platform admin)
    if (requestedTenantId && requestedTenantId !== user.tenantId && user.role !== 'ADMIN') {
      const error = ApplicationError.forbidden(
        'You cannot access data from another tenant'
      );
      reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  };
}
