import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@entities/user/users.api';
import type { UpdateUserPayload } from '@entities/user/users.types';
import { ApiError } from '@shared/api/client';
import { toast } from '@app/store/toast.store';
import { usersKeys } from './users.query-keys';

interface UseUpdateUserResult {
  updateUser: (id: string, payload: UpdateUserPayload) => void;
  isPending: boolean;
}

export function useUpdateUser(): UseUpdateUserResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      usersApi.updateUser(id, payload),
    onSuccess: (dto) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      toast.success('User updated', `${dto.firstName} ${dto.lastName} has been updated.`);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error('Failed to update user', error.message);
      } else {
        toast.error('Failed to update user', 'An unexpected error occurred.');
      }
    },
  });

  return {
    updateUser: (id, payload) => mutation.mutate({ id, payload }),
    isPending: mutation.isPending,
  };
}
