import { useState } from 'react';
import { authApi } from '@entities/auth/auth.api';
import { useAuthStore } from '@app/store/auth.store';
import { ApiError } from '@shared/api/client';
import i18n from '@shared/i18n/i18n';
/**
 * Handles the full login flow:
 *  1. Call POST /auth/login
 *  2. On success: populate the auth store (user + token)
 *  3. On error: expose a user-friendly message (no raw API errors to UI)
 */
export function useLogin() {
    const setAuth = useAuthStore((s) => s.setAuth);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState(null);
    const login = async ({ email, password }) => {
        setError(null);
        setIsPending(true);
        try {
            const response = await authApi.login({ email, password });
            const accessToken = response.accessToken
                ?? response.access_token
                ?? response.token;
            const refreshToken = response.refreshToken
                ?? response.refresh_token;
            if (!response.user || !accessToken) {
                setError(i18n.t('errors.auth.unableToSignIn'));
                return false;
            }
            setAuth({
                ...response.user,
                systemRole: response.user.systemRole ?? 'user',
            }, accessToken, refreshToken ?? null);
            return true;
        }
        catch (err) {
            if (err instanceof ApiError) {
                if (err.statusCode === 401 || err.statusCode === 400) {
                    setError(i18n.t('errors.auth.invalidCredentials'));
                }
                else if (err.statusCode === 429) {
                    setError(i18n.t('errors.auth.tooManyAttempts'));
                }
                else if (err.errorCode === 'API_NOT_CONFIGURED' || err.statusCode === 404) {
                    setError(i18n.t('errors.generic.backendUnavailable'));
                }
                else {
                    setError(i18n.t('errors.auth.unableToSignIn'));
                }
            }
            else {
                setError(i18n.t('errors.generic.network'));
            }
            return false;
        }
        finally {
            setIsPending(false);
        }
    };
    return { login, isPending, error, clearError: () => setError(null) };
}
