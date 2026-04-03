import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@entities/user/users.api';
import { mapUserDtoToUiModel } from '@entities/user/users.mapper';
import type { CreateUserPayload, UserUiModel } from '@entities/user/users.types';
import { toast } from '@app/store/toast.store';
import { ApiError } from '@shared/api/client';
import { usersKeys } from './users.query-keys';

interface UseCreateUserResult {
  createUser: (payload: CreateUserPayload) => Promise<UserUiModel>;
  isPending: boolean;
}

export function useCreateUser(): UseCreateUserResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: (dto) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      toast.success('User created', `${dto.firstName} ${dto.lastName} has been added.`);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error('Failed to create user', error.message);
      } else {
        toast.error('Failed to create user', 'An unexpected error occurred.');
      }
    },
  });

  return {
    createUser: async (payload) => mapUserDtoToUiModel(await mutation.mutateAsync(payload)),
    isPending: mutation.isPending,
  };
}
