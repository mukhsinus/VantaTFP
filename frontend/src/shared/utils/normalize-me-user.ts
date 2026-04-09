import type { CurrentUser } from '@shared/types/auth.types';

/** Normalizes `/users/me` payload (or stored profile shape) into `CurrentUser`. */
export function normalizeMeUser(raw: unknown, fallback: CurrentUser | null = null): CurrentUser | null {
  if (!raw || typeof raw !== 'object') return null;

  const value = raw as Record<string, unknown>;
  const userId = (value.userId as string | undefined) ?? (value.id as string | undefined);
  const tenantId = value.tenantId as string | undefined;
  const email = value.email as string | undefined;
  const firstName = value.firstName as string | undefined;
  const lastName = value.lastName as string | undefined;
  const role = value.role as CurrentUser['role'] | undefined;

  if (!userId || !tenantId || !email || !firstName || !lastName || !role) {
    return null;
  }

  return {
    userId,
    tenantId,
    tenantName: (value.tenantName as string | undefined) ?? fallback?.tenantName ?? 'Tenant',
    email,
    firstName,
    lastName,
    role,
  };
}
