import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { LoginPayload, LoginApiResponse, RefreshApiResponse } from './auth.types';

/**
 * Low-level auth API methods.
 * Components never call these directly — go through useLogin hook.
 */
export const authApi = {
  /**
   * Authenticates with email + password.
   * Returns access token, refresh token, and the full user object.
   */
  login: (payload: LoginPayload): Promise<LoginApiResponse> =>
    apiClient.post<LoginApiResponse>(API.auth.login, payload),

  refresh: (refreshToken: string): Promise<RefreshApiResponse> =>
    apiClient.post<RefreshApiResponse>(API.auth.refresh, { refreshToken }),

  /**
   * Fetches the authenticated user's profile.
   * Used for session bootstrap to re-hydrate user details from a stored token.
   */
  me: (): Promise<LoginApiResponse['user']> =>
    apiClient.get<LoginApiResponse['user']>(API.users.me),
};
