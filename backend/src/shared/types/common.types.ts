export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
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
