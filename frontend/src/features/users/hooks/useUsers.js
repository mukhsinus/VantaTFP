import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@entities/user/users.api';
import { mapUsersDtoToUiModel } from '@entities/user/users.mapper';
import { usersKeys } from './users.query-keys';
export function useUsers() {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: usersKeys.list(),
        queryFn: usersApi.getUsers,
        select: mapUsersDtoToUiModel,
    });
    return {
        users: data ?? [],
        isLoading,
        isError,
        error: error,
    };
}
