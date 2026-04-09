import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type {
  PlatformListResponse,
  PlatformSubscriptionRow,
  PlatformTenantRow,
  PlatformUserRow,
} from './platform.types';

export const platformApi = {
  listTenants: (page = 1, limit = 20) =>
    apiClient.get<PlatformListResponse<PlatformTenantRow>>(API.platform.tenants, { page, limit }),

  listUsers: (page = 1, limit = 20) =>
    apiClient.get<PlatformListResponse<PlatformUserRow>>(API.platform.users, { page, limit }),

  listSubscriptions: (page = 1, limit = 20) =>
    apiClient.get<PlatformListResponse<PlatformSubscriptionRow>>(API.platform.subscriptions, {
      page,
      limit,
    }),
};
