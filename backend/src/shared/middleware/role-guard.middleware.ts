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
    try {
      const user = request.user;

      if (!user) {
        throw ApplicationError.unauthorized();
      }

      const tenantId = request.tenantId ?? user.tenantId;
      const allowed = await request.server.policy.hasAnyRole(
        tenantId,
        user.role,
        allowedRoles
      );
      if (!allowed) {
        throw ApplicationError.forbidden(
          `Role '${user.role}' is not permitted to access this resource`
        );
      }
    } catch (err) {
      console.error('MIDDLEWARE ERROR:', err);
      throw err;
    }
  };
}

/**
 * Policy-based guard for permission checks.
 * Uses tenant-aware role permission mappings.
 */
export function requirePermission(action: string, resource: string) {
  return async function permissionGuard(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    try {
      const user = request.user;
      if (!user) {
        throw ApplicationError.unauthorized();
      }

      const tenantId = request.tenantId ?? user.tenantId;
      const allowed = await request.server.policy.checkPermission(
        tenantId,
        user.role,
        action,
        resource
      );

      if (!allowed) {
        throw ApplicationError.forbidden(
          `Permission denied: ${action}:${resource}`
        );
      }
    } catch (err) {
      console.error('MIDDLEWARE ERROR:', err);
      throw err;
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
    try {
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
    } catch (err) {
      console.error('MIDDLEWARE ERROR:', err);
      throw err;
    }
  };
}
