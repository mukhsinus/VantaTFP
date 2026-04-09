/**
 * Tenant + system RBAC preHandlers (use after `fastify.authenticate`).
 *
 * @example Platform-only route (e.g. cross-tenant admin API)
 * ```ts
 * app.get('/api/v1/admin/platform-stats', {
 *   preHandler: [app.authenticate, requireSystemRole('super_admin')],
 * }, handler);
 * ```
 *
 * @example Owner or super_admin (billing settings, delete tenant)
 * ```ts
 * app.post('/api/v1/tenants/:id/danger', {
 *   preHandler: [app.authenticate, requireOwner()],
 * }, handler);
 * ```
 *
 * @example Managers and owners (invites, team reports) — super_admin bypasses
 * ```ts
 * app.get('/api/v1/users', {
 *   preHandler: [app.authenticate, requireManagerOrAbove()],
 * }, handler);
 * ```
 *
 * @example Explicit tenant roles
 * ```ts
 * app.patch('/api/v1/settings', {
 *   preHandler: [app.authenticate, requireTenantRole('owner', 'manager')],
 * }, handler);
 * ```
 *
 * Employee “own tasks only” is enforced in services (e.g. filter by assignee / created_by),
 * not only via these guards — combine `requireTenantRole('employee')` with query scoping.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import type { SystemRole, TenantRole } from '../types/common.types.js';
import { ApplicationError } from '../utils/application-error.js';

function getUser(request: FastifyRequest) {
  const user = request.user;
  if (!user) {
    throw ApplicationError.unauthorized();
  }
  return user;
}

/**
 * Requires a platform-level role. `super_admin` bypasses nothing here — only matches `super_admin`.
 */
export function requireSystemRole(role: SystemRole) {
  return async function systemRoleGuard(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    const user = getUser(request);
    if (user.system_role !== role) {
      throw ApplicationError.forbidden(`Requires system role: ${role}`);
    }
  };
}

/**
 * Requires one of the given tenant roles. `super_admin` always passes (full platform access).
 */
export function requireTenantRole(...allowed: TenantRole[]) {
  if (allowed.length === 0) {
    throw new Error('requireTenantRole() needs at least one tenant role');
  }
  const set = new Set(allowed);

  return async function tenantRoleGuard(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    const user = getUser(request);
    if (user.system_role === 'super_admin') {
      return;
    }
    const tr = user.tenant_role;
    if (!tr || !set.has(tr)) {
      throw ApplicationError.forbidden(
        `Requires one of tenant roles: ${allowed.join(', ')}`
      );
    }
  };
}

/** Tenant owner or platform super_admin. */
export function requireOwner() {
  return requireTenantRole('owner');
}

/** Owner, manager, or super_admin (typical “management” gate). */
export function requireManagerOrAbove() {
  return requireTenantRole('owner', 'manager');
}
