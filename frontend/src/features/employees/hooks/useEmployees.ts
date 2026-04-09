import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '@entities/employees/employees.api';
import type { EmployeeUiModel } from '@entities/employees/employees.types';
import { useAuthStore } from '@app/store/auth.store';
import { employeesKeys } from './employees.query-keys';

function toUi(dto: { id: string; email: string; role: EmployeeUiModel['role']; isOwner: boolean }): EmployeeUiModel {
  const local = dto.email.split('@')[0]?.trim() || dto.email;
  return {
    id: dto.id,
    email: dto.email,
    role: dto.role,
    isOwner: dto.isOwner,
    displayName: local,
  };
}

interface UseEmployeesResult {
  employees: EmployeeUiModel[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useEmployees(): UseEmployeesResult {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: employeesKeys.list(),
    enabled: Boolean(accessToken),
    queryFn: employeesApi.list,
    select: (payload) => payload.data.map(toUi),
  });

  return {
    employees: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}
