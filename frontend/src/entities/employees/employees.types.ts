export type TenantRole = 'owner' | 'manager' | 'employee';

export interface EmployeeApiDto {
  id: string;
  email: string;
  /** Human-readable label from API (name, phone, or email-derived). */
  displayName?: string;
  phone?: string | null;
  role: TenantRole;
  isOwner: boolean;
}

export interface EmployeeListApiDto {
  data: EmployeeApiDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
}

export interface EmployeeUiModel {
  id: string;
  email: string;
  phone?: string | null;
  role: TenantRole;
  isOwner: boolean;
  /** Primary line: name, or phone, or sensible fallback. */
  displayName: string;
}

export interface CreateEmployeePayload {
  phone: string;
  name?: string;
  roleDescription?: string;
  password: string;
  role: 'manager' | 'employee';
}

export interface CreateEmployeeApiDto {
  id: string;
  phone: string;
  name: string | null;
  role: TenantRole;
}
