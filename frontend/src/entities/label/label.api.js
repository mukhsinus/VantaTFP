import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const labelApi = {
    list: () => apiClient.get(API.labels.list),
    create: (payload) => apiClient.post(API.labels.list, payload),
    update: (labelId, payload) => apiClient.patch(API.labels.detail(labelId), payload),
    delete: (labelId) => apiClient.delete(API.labels.detail(labelId)),
    getTaskLabels: (taskId) => apiClient.get(API.labels.taskLabels(taskId)),
    setTaskLabels: (taskId, labelIds) => apiClient.put(API.labels.taskLabels(taskId), { labelIds }),
};
