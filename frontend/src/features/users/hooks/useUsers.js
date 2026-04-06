import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@entities/user/users.api';
import { mapUsersDtoToUiModel } from '@entities/user/users.mapper';
import { useAuthStore } from '@app/store/auth.store';
import { usersKeys } from './users.query-keys';
export function useUsers() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const { data, isLoading, isError, error } = useQuery({
        queryKey: usersKeys.list(),
        enabled: Boolean(accessToken),
        queryFn: usersApi.getUsers,
        select: (payload) => {
            const users = Array.isArray(payload) ? payload : payload?.data ?? [];
            return mapUsersDtoToUiModel(users);
        },
    });
    return {
        users: data ?? [],
        isLoading,
        isError,
        error: error,
    };
}
