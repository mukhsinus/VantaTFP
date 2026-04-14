import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const automationApi = {
    list: (params) => apiClient.get(API.automations.list, params),
    getById: (ruleId) => apiClient.get(API.automations.detail(ruleId)),
    create: (payload) => apiClient.post(API.automations.list, payload),
    update: (ruleId, payload) => apiClient.patch(API.automations.detail(ruleId), payload),
    delete: (ruleId) => apiClient.delete(API.automations.detail(ruleId)),
};
