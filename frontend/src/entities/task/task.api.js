import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
/**
 * Low-level API functions for the tasks module.
 * These are the only functions allowed to call apiClient for tasks.
 * React Query hooks consume these — never components directly.
 */
export const taskApi = {
    list: (params) => apiClient.get(API.tasks.list, params),
    create: (payload) => apiClient.post(API.tasks.list, payload),
    update: (taskId, payload) => apiClient.patch(API.tasks.update(taskId), payload),
    delete: (taskId) => apiClient.delete(API.tasks.detail(taskId)),
};
