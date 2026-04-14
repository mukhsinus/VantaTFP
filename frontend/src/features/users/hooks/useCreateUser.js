import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '@entities/employees/employees.api';
import { toast } from '@app/store/toast.store';
import { ApiError } from '@shared/api/client';
import i18n from '@shared/i18n/i18n';
import { usersKeys } from './users.query-keys';
import { employeesKeys } from '@features/employees/hooks/employees.query-keys';
export function useCreateUser() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: employeesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: employeesKeys.lists() });
            toast.success(i18n.t('errors.user.created'));
        },
        onError: (error) => {
            if (error instanceof ApiError) {
                toast.error(i18n.t('errors.user.createFailed'), error.message);
            }
            else {
                toast.error(i18n.t('errors.user.createFailed'), i18n.t('errors.generic.unexpected'));
            }
        },
    });
    return {
        createUser: async (payload) => {
            await mutation.mutateAsync(payload);
        },
        isPending: mutation.isPending,
    };
}
