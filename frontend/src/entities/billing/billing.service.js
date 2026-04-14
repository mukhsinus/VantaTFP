import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const billingService = {
    getCurrent: () => apiClient.get(API.billing.current),
    upgrade: (plan) => apiClient.post(API.billing.upgrade, { plan }),
};
