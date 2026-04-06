import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@entities/user/users.api';
import { ApiError } from '@shared/api/client';
import { toast } from '@app/store/toast.store';
import i18n from '@shared/i18n/i18n';
import { usersKeys } from './users.query-keys';
export function useDeleteUser() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: usersApi.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
            toast.success(i18n.t('profile.employee.actions.deactivateTitle'), i18n.t('profile.employee.actions.deactivateDescription'));
        },
        onError: (error) => {
            if (error instanceof ApiError) {
                toast.error(i18n.t('errors.user.deactivateFailed'), error.message);
            }
            else {
                toast.error(i18n.t('errors.user.deactivateFailed'), i18n.t('errors.generic.unexpected'));
            }
        },
    });
    return {
        deleteUser: (id) => mutation.mutate(id),
        isPending: mutation.isPending,
    };
}
