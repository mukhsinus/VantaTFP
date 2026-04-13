import { useState } from 'react';
import { authApi } from '@entities/auth/auth.api';
import { useAuthStore } from '@app/store/auth.store';
import { ApiError } from '@shared/api/client';
import type { LoginPayload } from '@entities/auth/auth.types';
import i18n from '@shared/i18n/i18n';

interface UseLoginResult {
  /** Returns true on success, false on failure. Error message is exposed via `error`. */
  login:      (payload: LoginPayload) => Promise<boolean>;
  isPending:  boolean;
  error:      string | null;
  clearError: () => void;
}

/**
 * Handles the full login flow:
 *  1. Call POST /auth/login
 *  2. On success: populate the auth store (user + token)
 *  3. On error: expose a user-friendly message (no raw API errors to UI)
 */
export function useLogin(): UseLoginResult {
  const setSession = useAuthStore((s) => s.setSession);
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const login = async ({ email, phone, password }: LoginPayload): Promise<boolean> => {
    setError(null);
    setIsPending(true);

    try {
      const response = await authApi.login({ email, phone, password });
      const accessToken =
        (response as { accessToken?: string; access_token?: string; token?: string }).accessToken
        ?? (response as { access_token?: string }).access_token
        ?? (response as { token?: string }).token;
      const refreshToken =
        (response as { refreshToken?: string; refresh_token?: string }).refreshToken
        ?? (response as { refresh_token?: string }).refresh_token;

      if (!response.user || !accessToken) {
        setError(i18n.t('errors.auth.unableToSignIn'));
        return false;
      }

      const primaryMembership = response.memberships[0] ?? null;
      const derivedRole = primaryMembership?.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
      const resolvedTenant = response.tenant
        ? {
            id: response.tenant.id,
            name: response.tenant.name,
            slug: response.tenant.slug,
            planId: response.tenant.plan_id,
            isActive: response.tenant.is_active,
          }
        : null;
      const resolvedUser = {
        userId: response.user.id,
        tenantId: resolvedTenant?.id ?? primaryMembership?.tenant_id ?? '',
        tenantName: resolvedTenant?.name ?? 'Platform',
        email: response.user.email,
        firstName: response.user.first_name,
        lastName: response.user.last_name,
        role: derivedRole,
        systemRole: response.user.system_role,
      } as const;

      setSession(
        {
          user: resolvedUser,
          tenant: resolvedTenant,
          memberships: response.memberships.map((membership) => ({
            userId: membership.user_id,
            tenantId: membership.tenant_id,
            role: membership.role,
          })),
          activeTenantId: resolvedTenant?.id ?? primaryMembership?.tenant_id ?? null,
        },
        accessToken,
        refreshToken ?? null
      );
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401 || err.statusCode === 400) {
          setError(i18n.t('errors.auth.invalidCredentials'));
        } else if (err.statusCode === 429) {
          setError(i18n.t('errors.auth.tooManyAttempts'));
        } else if (err.errorCode === 'API_NOT_CONFIGURED' || err.statusCode === 404) {
          setError(i18n.t('errors.generic.backendUnavailable'));
        } else {
          setError(i18n.t('errors.auth.unableToSignIn'));
        }
      } else {
        setError(i18n.t('errors.generic.network'));
      }
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return { login, isPending, error, clearError: () => setError(null) };
}
