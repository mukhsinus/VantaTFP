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
 * @example Managers and owners (invites, team reports) -- super_admin bypasses
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
 * Employee "own tasks only" is enforced in services (e.g. filter by assignee / created_by),
 * not only via these guards -- combine `requireTenantRole('employee')` with query scoping.
 *
 * @example Policy-based can() check (custom RBAC from DB)
 * ```ts
 * app.delete('/tasks/:id', {
 *   preHandler: [authenticate, requireCan(policyService, 'delete', 'tasks')],
 * }, handler);
 * ```
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import type { SystemRole, TenantRole } from '../types/common.types.js';
import { ApplicationError } from '../utils/application-error.js';
import type { PolicyService } from '../policy/policy.service.js';

function getUser(request: FastifyRequest) {
  const user = request.user;
  if (!user) {
    throw ApplicationError.unauthorized();
  }
  return user;
}

export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  getUser(request);
}

export async function requireTenant(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const user = getUser(request);
  if (user.system_role === 'super_admin') {
    return;
  }
  const tenantId = request.tenantId ?? user.tenant_id ?? user.tenantId;
  if (!tenantId) {
    throw ApplicationError.forbidden('Tenant context required');
  }
}

export async function requireSuperAdmin(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const user = getUser(request);
  if (user.system_role !== 'super_admin') {
    throw ApplicationError.forbidden('Super admin access required');
  }
}

/**
 * Requires a platform-level role. `super_admin` bypasses nothing here -- only matches `super_admin`.
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
 * Policy-first RBAC guard. Checks `can(user, action, resource)` against tenant policy rules.
 */
export function requireRole(action: string, resource: string) {
  return async function rolePolicyGuard(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    const user = getUser(request);
    if (user.system_role === 'super_admin') {
      return;
    }

    const tenantId = request.tenantId ?? user.tenant_id ?? user.tenantId;
    if (!tenantId) {
      throw ApplicationError.forbidden('Tenant context required');
    }

    const roleCode = user.tenant_role ?? user.role;
    if (!roleCode) {
      throw ApplicationError.forbidden('No role assigned');
    }

    const allowed = await request.server.policy.checkPermission(
      tenantId,
      roleCode,
      action,
      resource
    );

    if (!allowed) {
      throw ApplicationError.forbidden(`Permission denied: ${action}:${resource}`);
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

/**
 * Tenant owner only -- no super_admin bypass (e.g. plan upgrade must be done by the workspace owner).
 */
export function requireTenantOwnerStrict() {
  return async function ownerStrictGuard(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    const user = getUser(request);
    if (user.system_role === 'super_admin') {
      throw ApplicationError.forbidden('Only the tenant owner can perform this action');
    }
    const tr = user.tenant_role;
    if (tr !== 'owner') {
      throw ApplicationError.forbidden('Only the tenant owner can perform this action');
    }
    const tenantId = user.tenant_id ?? user.tenantId;
    if (!tenantId || String(tenantId).trim().length === 0) {
      throw ApplicationError.forbidden('Tenant context required');
    }
  };
}

/** Owner, manager, or super_admin (typical "management" gate). */
export function requireManagerOrAbove() {
  return requireTenantRole('owner', 'manager');
}

/**
 * Policy-based `can(user, action, resource)` guard.
 * Uses PolicyService.checkPermission() to evaluate custom RBAC rules from the DB.
 * `super_admin` always passes. Built-in tenant roles are evaluated against the policy table.
 */
export function requireCan(policyService: PolicyService, action: string, resource: string) {
  return async function canGuard(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    const user = getUser(request);

    if (user.system_role === 'super_admin') {
      return;
    }

    const tenantId = request.tenantId ?? user.tenant_id ?? (user as any).tenantId;
    if (!tenantId) {
      throw ApplicationError.forbidden('Tenant context required');
    }

    const roleCode = user.tenant_role ?? user.role;
    if (!roleCode) {
      throw ApplicationError.forbidden('No role assigned');
    }

    const allowed = await policyService.checkPermission(tenantId, roleCode, action, resource);
    if (!allowed) {
      throw ApplicationError.forbidden(`Permission denied: ${action}:${resource}`);
    }
  };
}

/**
 * Convenience alias: named-role check (fast path, no DB policy lookup).
 * Use when the role set is static and well-known. For dynamic permissions, use requireCan().
 */
export function requireRoles(...roles: TenantRole[]) {
  return requireTenantRole(...roles);
}
