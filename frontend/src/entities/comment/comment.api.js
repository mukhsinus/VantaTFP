import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const commentApi = {
    list: (taskId, params) => apiClient.get(API.comments.list(taskId), params),
    create: (taskId, payload) => apiClient.post(API.comments.list(taskId), payload),
    update: (taskId, commentId, payload) => apiClient.patch(API.comments.detail(taskId, commentId), payload),
    delete: (taskId, commentId) => apiClient.delete(API.comments.detail(taskId, commentId)),
};
