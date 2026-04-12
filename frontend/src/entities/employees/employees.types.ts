export type TenantRole = 'owner' | 'manager' | 'employee';

export interface EmployeeApiDto {
  id: string;
  email: string;
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
  role: TenantRole;
  isOwner: boolean;
  /** Short label derived from email (before @). */
  displayName: string;
}
