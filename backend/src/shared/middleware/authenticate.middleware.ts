import { FastifyRequest, FastifyReply } from 'fastify';
import { ApplicationError } from '../utils/application-error.js';
import { attachTenantContext } from './tenant.middleware.js';

/**
 * Verifies the JWT attached to the request and populates request.user.
 * Registered as a Fastify decorator so controllers can reference it by name.
 */
export async function authenticateMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (request.url === '/health' || request.url.startsWith('/health?')) {
    return;
  }
  if (request.url === '/api/health' || request.url.startsWith('/api/health?')) {
    return;
  }

  try {
    console.log('Auth middleware hit');
    try {
      await request.jwtVerify();
    } catch {
      throw ApplicationError.unauthorized('Invalid or expired token');
    }

    attachTenantContext(request);

    const tenantId = request.tenantId;
    if (tenantId) {
      await request.server.billing.enforceTenantApiRate(request.url, tenantId);
    }
  } catch (err) {
    console.error('MIDDLEWARE ERROR:', err);
    throw err;
  }
}
