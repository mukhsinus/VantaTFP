import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const employeesApi = {
    list: () => apiClient.get(API.employees.list),
    patchRole: (id, role) => apiClient.patch(API.employees.patchRole(id), { role }),
    remove: (id) => apiClient.delete(API.employees.detail(id)),
};
