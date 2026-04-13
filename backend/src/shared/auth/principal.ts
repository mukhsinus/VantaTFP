import type { AuthenticatedUser, Role, SystemRole, TenantRole } from '../types/common.types.js';
import { ApplicationError } from '../utils/application-error.js';

/** Row from `AuthRepository.findAuthContextById` */
export type AuthContextRow = {
  id: string;
  email: string;
  system_role: string;
  legacy_role: string;
  user_primary_tenant_id: string | null;
  effective_tenant_id: string | null;
  membership_role: string | null;
  tenant_plan: string | null;
};

const TENANT_ROLES: TenantRole[] = ['owner', 'manager', 'employee'];
export const SUPER_ADMIN_EMAIL = 'kamolovmuhsin@icloud.com';

export function isSuperAdmin(user: {
  email?: string | null;
  system_role?: string | null;
}): boolean {
  const normalizedEmail = String(user.email ?? '')
    .trim()
    .toLowerCase();
  if (normalizedEmail === SUPER_ADMIN_EMAIL) {
    return true;
  }
  return String(user.system_role ?? '')
    .trim()
    .toLowerCase() === 'super_admin';
}

function isTenantRole(value: string | null): value is TenantRole {
  return value !== null && TENANT_ROLES.includes(value as TenantRole);
}

export function tenantRoleFromLegacyUserRole(legacy: string): TenantRole {
  switch (legacy) {
    case 'ADMIN':
      return 'owner';
    case 'MANAGER':
      return 'manager';
    default:
      return 'employee';
  }
}

export function legacyRoleFromTenantRole(tenantRole: TenantRole | null): Role {
  switch (tenantRole) {
    case 'owner':
      return 'ADMIN';
    case 'manager':
      return 'MANAGER';
    case 'employee':
    default:
      return 'EMPLOYEE';
  }
}

function asSystemRole(value: string): SystemRole {
  const v = String(value ?? '')
    .trim()
    .toLowerCase();
  return v === 'super_admin' ? 'super_admin' : 'user';
}

/**
 * Builds the canonical `AuthenticatedUser` after JWT verify + DB lookup.
 * `jwtTenantId` is the tenant id from the token (if any).
 */
export function buildAuthenticatedUser(
  row: AuthContextRow,
  jwtTenantId: string | null | undefined
): AuthenticatedUser {
  const system_role = isSuperAdmin({ email: row.email, system_role: row.system_role })
    ? 'super_admin'
    : asSystemRole(row.system_role);

  if (system_role === 'super_admin') {
    // Platform user: no tenant/subscription scope (ignore JWT and DB primary tenant).
    return {
      id: row.id,
      userId: row.id,
      system_role,
      tenant_role: null,
      tenant_id: null,
      tenantId: '',
      email: row.email,
      role: 'ADMIN',
      tenantPlan: null,
    };
  }

  const effective = row.effective_tenant_id;
  if (!effective) {
    throw ApplicationError.unauthorized('Missing tenant context');
  }

  let tenant_role: TenantRole | null = isTenantRole(row.membership_role)
    ? row.membership_role
    : null;

  if (!tenant_role) {
    if (row.user_primary_tenant_id === effective) {
      tenant_role = tenantRoleFromLegacyUserRole(row.legacy_role);
    } else {
      throw ApplicationError.forbidden('Not a member of this tenant');
    }
  }

  const role = legacyRoleFromTenantRole(tenant_role);

  return {
    id: row.id,
    userId: row.id,
    system_role,
    tenant_role,
    tenant_id: effective,
    tenantId: effective,
    email: row.email,
    role,
    tenantPlan: row.tenant_plan ?? null,
  };
}
