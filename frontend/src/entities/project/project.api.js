import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const projectApi = {
    list: (params) => apiClient.get(API.projects.list, params),
    getById: (projectId) => apiClient.get(API.projects.detail(projectId)),
    create: (payload) => apiClient.post(API.projects.list, payload),
    update: (projectId, payload) => apiClient.patch(API.projects.detail(projectId), payload),
    delete: (projectId) => apiClient.delete(API.projects.detail(projectId)),
};
