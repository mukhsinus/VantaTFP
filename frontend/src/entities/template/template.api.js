import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const templateApi = {
    list: () => apiClient.get(API.templates.list),
    getById: (templateId) => apiClient.get(API.templates.detail(templateId)),
    create: (payload) => apiClient.post(API.templates.list, payload),
    update: (templateId, payload) => apiClient.patch(API.templates.detail(templateId), payload),
    delete: (templateId) => apiClient.delete(API.templates.detail(templateId)),
};
