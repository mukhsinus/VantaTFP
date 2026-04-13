export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

/** Platform scope (`users.system_role`); distinct from tenant `role`. */
export type SystemRole = 'super_admin' | 'user';

export interface CurrentUser {
  userId: string;
  tenantId: string;
  tenantName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  /** Omitted in older persisted sessions; treat missing as `'user'`. */
  systemRole?: SystemRole;
}

export interface CurrentTenant {
  id: string;
  name: string;
  slug: string;
  planId: string | null;
  isActive: boolean;
}

export interface Membership {
  userId: string;
  tenantId: string;
  role: 'ADMIN' | 'EMPLOYEE';
}
