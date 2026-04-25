import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '@entities/employees/employees.api';
import type { EmployeeUiModel } from '@entities/employees/employees.types';
import { useAuthStore } from '@app/store/auth.store';
import { employeesKeys } from './employees.query-keys';

function toUi(dto: {
  id: string;
  email: string;
  displayName?: string;
  phone?: string | null;
  role: EmployeeUiModel['role'];
  isOwner: boolean;
}): EmployeeUiModel {
  const displayName =
    (dto.displayName && dto.displayName.trim()) ||
    (dto.phone && dto.phone.trim()) ||
    (dto.email.split('@')[0]?.trim() || dto.email);
  return {
    id: dto.id,
    email: dto.email,
    phone: dto.phone ?? null,
    role: dto.role,
    isOwner: dto.isOwner,
    displayName,
  };
}

interface UseEmployeesResult {
  employees: EmployeeUiModel[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

interface UseEmployeesOptions {
  enabled?: boolean;
}

export function useEmployees(options?: UseEmployeesOptions): UseEmployeesResult {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: employeesKeys.list(),
    enabled: Boolean(accessToken) && (options?.enabled ?? true),
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
