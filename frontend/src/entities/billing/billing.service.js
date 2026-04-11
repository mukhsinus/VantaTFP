import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const billingService = {
    /** Legacy snapshot shape; prefer {@link getCurrent} for new UI. */
    getSnapshot: () => apiClient.get(API.billing.snapshot),
    getCurrent: () => apiClient.get(API.billing.current),
    getPlans: () => apiClient.get(API.billing.plans),
    upgrade: (plan) => apiClient.post(API.billing.upgrade, { plan }),
};
