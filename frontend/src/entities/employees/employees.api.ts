import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { EmployeeApiDto, EmployeeListApiDto } from './employees.types';

export const employeesApi = {
  list: (): Promise<EmployeeListApiDto> =>
    apiClient.get<EmployeeListApiDto>(API.employees.list),

  patchRole: (id: string, role: 'manager' | 'employee'): Promise<EmployeeApiDto> =>
    apiClient.patch<EmployeeApiDto>(API.employees.patchRole(id), { role }),

  remove: (id: string): Promise<void> => apiClient.delete<void>(API.employees.detail(id)),
};
