export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string | null; // NULL for super admins
  email: string;
  role: Role;
  tenantPlan?: 'FREE' | 'PRO' | 'ENTERPRISE';
  is_super_admin?: boolean; // Set to true for super admin users
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
