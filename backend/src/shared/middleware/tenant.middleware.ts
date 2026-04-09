import { FastifyRequest, FastifyReply } from 'fastify';
import { ApplicationError } from '../utils/application-error.js';

/**
 * Copies tenant_id from the verified JWT user onto the request for consistent access.
 * Must run only after `authenticate` (JWT verified and `request.user` set).
 */
export function attachTenantContext(request: FastifyRequest): void {
  const tenantId = request.user?.tenantId;
  if (!tenantId || typeof tenantId !== 'string') {
    throw ApplicationError.unauthorized('Missing tenant context');
  }
  request.tenantId = tenantId;
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
