import type { CurrentUser, SystemRole } from '@shared/types/auth.types';

function asSystemRole(raw: unknown): SystemRole {
  return raw === 'super_admin' ? 'super_admin' : 'user';
}

/** Normalizes `/users/me` payload (or stored profile shape) into `CurrentUser`. */
export function normalizeMeUser(raw: unknown, fallback: CurrentUser | null = null): CurrentUser | null {
  if (!raw || typeof raw !== 'object') return null;

  const value = raw as Record<string, unknown>;
  const userId = (value.userId as string | undefined) ?? (value.id as string | undefined);
  const tenantId = (value.tenantId as string | undefined) ?? '';
  const email = value.email as string | undefined;
  const firstName =
    (value.firstName as string | undefined) ?? (value.first_name as string | undefined);
  const lastName =
    (value.lastName as string | undefined) ?? (value.last_name as string | undefined);
  const role = value.role as CurrentUser['role'] | undefined;
  const systemRole =
    value.systemRole !== undefined
      ? asSystemRole(value.systemRole)
      : value.system_role !== undefined
        ? asSystemRole(value.system_role)
        : (fallback?.systemRole ?? 'user');

  if (!userId || !email || !firstName || !lastName || !role) {
    return null;
  }

  if (systemRole !== 'super_admin' && !tenantId) {
    return null;
  }

  return {
    userId,
    tenantId,
    tenantName:
      (value.tenantName as string | undefined)
      ?? (value.tenant_name as string | undefined)
      ?? fallback?.tenantName
      ?? 'Tenant',
    email,
    firstName,
    lastName,
    role,
    systemRole,
  };
}
