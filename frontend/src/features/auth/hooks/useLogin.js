import { useState } from 'react';
import { authApi } from '@entities/auth/auth.api';
import { useAuthStore } from '@app/store/auth.store';
import { ApiError } from '@shared/api/client';
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
            setAuth(response.user, response.accessToken);
            return true;
        }
        catch (err) {
            if (err instanceof ApiError) {
                if (err.statusCode === 401 || err.statusCode === 400) {
                    setError('Invalid email or password. Please try again.');
                }
                else {
                    setError('Unable to sign in right now. Please try again later.');
                }
            }
            else {
                setError('A network error occurred. Please check your connection.');
            }
            return false;
        }
        finally {
            setIsPending(false);
        }
    };
    return { login, isPending, error, clearError: () => setError(null) };
}
