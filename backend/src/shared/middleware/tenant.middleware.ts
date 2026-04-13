import { FastifyRequest, FastifyReply } from 'fastify';
import { ApplicationError } from '../utils/application-error.js';

/**
 * Copies tenant id onto `request.tenantId` for billing and repositories.
 * `super_admin` may omit a tenant (skips validation); optional tenant still attaches for scoped routes.
 */
export function attachTenantContext(request: FastifyRequest): void {
  const user = request.user;
  if (!user) {
    throw ApplicationError.unauthorized('Missing user');
  }

  if (user.system_role === 'super_admin') {
    const tid = user.tenant_id;
    request.tenantId = tid && tid.length > 0 ? tid : undefined;
    request.tenant = request.tenantId ? { id: request.tenantId } : undefined;
    return;
  }

  const tenantId = user.tenant_id ?? user.tenantId;
  if (!tenantId || typeof tenantId !== 'string' || tenantId.length === 0) {
    throw ApplicationError.unauthorized('Missing tenant context');
  }
  request.tenantId = tenantId;
  request.tenant = { id: tenantId };
}

/**
 * Optional preHandler for routes that already use `authenticate` — same as `attachTenantContext`.
 */
export async function tenantContextMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    attachTenantContext(request);
  } catch (err) {
    console.error('MIDDLEWARE ERROR:', err);
    throw err;
  }
}
