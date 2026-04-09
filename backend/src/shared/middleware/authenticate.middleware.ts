import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthRepository } from '../../modules/auth/auth.repository.js';
import { buildAuthenticatedUser } from '../auth/principal.js';
import type { AuthenticatedUser } from '../types/common.types.js';
import { ApplicationError } from '../utils/application-error.js';
import { attachTenantContext } from './tenant.middleware.js';

type JwtPayloadShape = Partial<AuthenticatedUser> & {
  userId?: string;
  id?: string;
  tenantId?: string;
  tenant_id?: string | null;
};

function resolveJwtTenantId(raw: JwtPayloadShape): string | null {
  if (typeof raw.tenantId === 'string' && raw.tenantId.length > 0) {
    return raw.tenantId;
  }
  if (typeof raw.tenant_id === 'string' && raw.tenant_id.length > 0) {
    return raw.tenant_id;
  }
  return null;
}

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
    const userId = raw.userId ?? raw.id;
    if (!userId) {
      throw ApplicationError.unauthorized('Invalid token subject');
    }

    const jwtTenantId = resolveJwtTenantId(raw);
    const authRepository = new AuthRepository(request.server.db);
    const ctx = await authRepository.findAuthContextById(userId, jwtTenantId);
    if (!ctx) {
      throw ApplicationError.unauthorized('User no longer exists or is inactive');
    }

    request.user = buildAuthenticatedUser(ctx, jwtTenantId);

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
