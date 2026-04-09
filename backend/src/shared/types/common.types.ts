export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

/** Platform scope (column `users.system_role`). */
export type SystemRole = 'super_admin' | 'user';

/** Per-tenant role (`tenant_users.role`). */
export type TenantRole = 'owner' | 'manager' | 'employee';

/**
 * Canonical auth principal after `authenticate` (JWT + DB hydration).
 * Legacy `userId` / `tenantId` / `role` remain for backward compatibility.
 */
export interface AuthenticatedUser {
  id: string;
  system_role: SystemRole;
  tenant_role: TenantRole | null;
  tenant_id: string | null;
  email: string;
  /** Derived from `tenant_role` for existing policy / `requireRoles`. */
  role: Role;
  /** @deprecated use `id` */
  userId: string;
  /** @deprecated use `tenant_id` (empty string when no tenant, e.g. super_admin) */
  tenantId: string;
}

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type TenantScoped = {
  tenantId: string;
};
