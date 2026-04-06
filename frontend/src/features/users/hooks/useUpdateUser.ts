import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@entities/user/users.api';
import type { UpdateUserPayload } from '@entities/user/users.types';
import { ApiError } from '@shared/api/client';
import { toast } from '@app/store/toast.store';
import i18n from '@shared/i18n/i18n';
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
      toast.success(
        i18n.t('errors.user.updated'),
        i18n.t('errors.user.updatedDescription', { fullName: `${dto.firstName} ${dto.lastName}` })
      );
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(i18n.t('errors.user.updateFailed'), error.message);
      } else {
        toast.error(i18n.t('errors.user.updateFailed'), i18n.t('errors.generic.unexpected'));
      }
    },
  });

  return {
    updateUser: (id, payload) => mutation.mutate({ id, payload }),
    isPending: mutation.isPending,
  };
}
