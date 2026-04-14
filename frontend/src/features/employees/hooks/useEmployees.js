import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '@entities/employees/employees.api';
import { useAuthStore } from '@app/store/auth.store';
import { employeesKeys } from './employees.query-keys';
function toUi(dto) {
    const displayName = (dto.displayName && dto.displayName.trim()) ||
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
export function useEmployees() {
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
        error: error,
    };
}
