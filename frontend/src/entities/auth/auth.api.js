import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
/**
 * Low-level auth API methods.
 * Components never call these directly — go through useLogin hook.
 */
export const authApi = {
    /**
     * Authenticates with email + password.
     * Returns access token, refresh token, and the full user object.
     */
    login: (payload) => apiClient.post(API.auth.login, payload),
    /**
     * Fetches the authenticated user's profile.
     * Used for session bootstrap to re-hydrate user details from a stored token.
     */
    me: () => apiClient.get(API.users.me),
};
