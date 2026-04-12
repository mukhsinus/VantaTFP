import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const platformApi = {
    listTenants: (page = 1, limit = 20) => apiClient.get(API.platform.tenants, { page, limit }),
    listUsers: (page = 1, limit = 20) => apiClient.get(API.platform.users, { page, limit }),
    listSubscriptions: (page = 1, limit = 20) => apiClient.get(API.platform.subscriptions, {
        page,
        limit,
    }),
};
