import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@entities/user/users.api';
import { mapUsersDtoToUiModel } from '@entities/user/users.mapper';
import type { UserUiModel } from '@entities/user/users.types';
import { usersKeys } from './users.query-keys';

interface UseUsersResult {
  users: UserUiModel[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useUsers(): UseUsersResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: usersKeys.list(),
    queryFn: usersApi.getUsers,
    select: mapUsersDtoToUiModel,
  });

  return {
    users: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}
