import type { Role } from '@shared/types/auth.types';

export interface UserApiDto {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  managerId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  managerId?: string;
}

export interface UpdateUserPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  managerId?: string | null;
}

export interface UserUiModel {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAtLabel: string;
}
