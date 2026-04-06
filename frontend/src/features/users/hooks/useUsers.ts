import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@entities/user/users.api';
import { mapUsersDtoToUiModel } from '@entities/user/users.mapper';
import type { UserApiDto, UserListApiDto, UserUiModel } from '@entities/user/users.types';
import { useAuthStore } from '@app/store/auth.store';
import { usersKeys } from './users.query-keys';

interface UseUsersResult {
  users: UserUiModel[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useUsers(): UseUsersResult {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: usersKeys.list(),
    enabled: Boolean(accessToken),
    queryFn: usersApi.getUsers,
    select: (payload: UserApiDto[] | UserListApiDto) => {
      const users = Array.isArray(payload) ? payload : payload?.data ?? [];
      return mapUsersDtoToUiModel(users);
    },
  });

  return {
    users: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}
