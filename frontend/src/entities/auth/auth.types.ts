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
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    system_role: 'super_admin' | 'user';
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan_id: string | null;
    is_active: boolean;
  } | null;
  memberships: Array<{
    user_id: string;
    tenant_id: string;
    role: 'ADMIN' | 'EMPLOYEE';
  }>;
}

export interface RefreshApiResponse {
  accessToken: string;
  refreshToken: string;
}
