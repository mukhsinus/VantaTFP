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
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const login = async ({ email, password }: LoginPayload): Promise<boolean> => {
    setError(null);
    setIsPending(true);

    try {
      const response = await authApi.login({ email, password });
      setAuth(response.user, response.accessToken);
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401 || err.statusCode === 400) {
          setError(i18n.t('errors.auth.invalidCredentials'));
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
