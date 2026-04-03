import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@entities/user/users.api';
import { ApiError } from '@shared/api/client';
import { toast } from '@app/store/toast.store';
import { usersKeys } from './users.query-keys';

interface UseDeleteUserResult {
  deleteUser: (id: string) => void;
  isPending: boolean;
}

export function useDeleteUser(): UseDeleteUserResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      toast.success('User deactivated', 'The user is now inactive.');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error('Failed to deactivate user', error.message);
      } else {
        toast.error('Failed to deactivate user', 'An unexpected error occurred.');
      }
    },
  });

  return {
    deleteUser: (id) => mutation.mutate(id),
    isPending: mutation.isPending,
  };
}
