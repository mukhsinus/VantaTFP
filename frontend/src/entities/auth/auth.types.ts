import type { Role } from '@shared/types/auth.types';

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface LoginPayload {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterEmployerPayload {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  companyName: string;
}

// ─── API responses ────────────────────────────────────────────────────────────

/**
 * Shape the backend returns from POST /auth/login.
 * The user object is returned alongside the tokens so the frontend
 * can populate the auth store without an extra /me round-trip.
 */
export interface LoginApiResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: string;
    tenantId: string;
    tenantName: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    systemRole?: 'super_admin' | 'user';
  };
}

export interface RefreshApiResponse {
  accessToken: string;
  refreshToken: string;
}
