import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const usersApi = {
    getUsers: () => apiClient.get(API.users.list),
    createUser: (payload) => apiClient.post(API.users.list, payload),
    updateUser: (id, payload) => apiClient.patch(API.users.detail(id), payload),
    deleteUser: (id) => apiClient.delete(API.users.detail(id)),
};
