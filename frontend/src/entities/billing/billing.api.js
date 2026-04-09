import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const billingApi = {
    snapshot: () => apiClient.get(API.billing.snapshot),
};
