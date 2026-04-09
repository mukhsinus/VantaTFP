import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthRepository } from '../../modules/auth/auth.repository.js';
import { parseJwtTenantIdFromPayload } from '../auth/jwt-tenant.js';
import { buildAuthenticatedUser } from '../auth/principal.js';
import type { AuthenticatedUser } from '../types/common.types.js';
import { ApplicationError } from '../utils/application-error.js';
import { attachTenantContext } from './tenant.middleware.js';

type JwtPayloadShape = Partial<AuthenticatedUser> & {
  userId?: string;
  id?: string;
  /** Some JWT stacks surface subject only as `sub`. */
  sub?: string;
  tenantId?: string;
  tenant_id?: string | null;
};

/**
 * Verifies the JWT, loads `system_role` + `tenant_users.role`, and sets `request.user`.
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
    try {
      await request.jwtVerify();
    } catch {
      throw ApplicationError.unauthorized('Invalid or expired token');
    }

    const raw = request.user as JwtPayloadShape;
    const userId = raw.userId ?? raw.id ?? (typeof raw.sub === 'string' ? raw.sub : undefined);
    if (!userId) {
      throw ApplicationError.unauthorized('Invalid token subject');
    }

    const jwtTenantId = parseJwtTenantIdFromPayload(raw);
    const authRepository = new AuthRepository(request.server.db);
    const ctx = await authRepository.findAuthContextById(userId, jwtTenantId);
    if (!ctx) {
      throw ApplicationError.unauthorized('User no longer exists or is inactive');
    }

    request.user = buildAuthenticatedUser(ctx, jwtTenantId);

    attachTenantContext(request);

    const tenantId = request.tenantId;
    if (tenantId && request.user.system_role !== 'super_admin') {
      await request.server.billing.enforceTenantApiRate(request.url, tenantId);
    }
  } catch (err) {
    console.error('MIDDLEWARE ERROR:', err);
    throw err;
  }
}
