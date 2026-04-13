import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { LoginPayload, LoginApiResponse, RefreshApiResponse, RegisterEmployerPayload } from './auth.types';

/**
 * Low-level auth API methods.
 * Components never call these directly — go through useLogin / useRegisterEmployer hooks.
 */
export const authApi = {
  /** Authenticates with email or phone + password. */
  login: (payload: LoginPayload): Promise<LoginApiResponse> =>
    apiClient.post<LoginApiResponse>(API.auth.login, payload),

  /** Public employer self-registration (creates tenant + owner + 15-day trial). */
  registerEmployer: (payload: RegisterEmployerPayload): Promise<LoginApiResponse> =>
    apiClient.post<LoginApiResponse>(API.auth.registerEmployer, payload),

  refresh: (refreshToken: string): Promise<RefreshApiResponse> =>
    apiClient.post<RefreshApiResponse>(API.auth.refresh, { refreshToken }),

  me: (): Promise<unknown> =>
    apiClient.get<unknown>(API.users.me),
};
