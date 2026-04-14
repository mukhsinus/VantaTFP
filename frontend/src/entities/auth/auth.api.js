import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
/**
 * Low-level auth API methods.
 * Components never call these directly — go through useLogin / useRegisterEmployer hooks.
 */
export const authApi = {
    /** Authenticates with email or phone + password. */
    login: (payload) => apiClient.post(API.auth.login, payload),
    /** Public employer self-registration (creates tenant + owner + 15-day trial). */
    registerEmployer: (payload) => apiClient.post(API.auth.registerEmployer, payload),
    refresh: (refreshToken) => apiClient.post(API.auth.refresh, { refreshToken }),
    me: () => apiClient.get(API.users.me),
};
