import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '@entities/employees/employees.api';
import { ApiError } from '@shared/api/client';
import { toast } from '@app/store/toast.store';
import i18n from '@shared/i18n/i18n';
import { employeesKeys } from './employees.query-keys';
export function useDeleteEmployee() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: employeesApi.remove,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: employeesKeys.list() });
            const previous = queryClient.getQueryData(employeesKeys.list());
            queryClient.setQueryData(employeesKeys.list(), (old) => {
                if (!old)
                    return old;
                return {
                    ...old,
                    data: old.data.filter((e) => e.id !== id),
                    pagination: {
                        ...old.pagination,
                        total: Math.max(0, old.pagination.total - 1),
                    },
                };
            });
            return { previous };
        },
        onError: (error, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(employeesKeys.list(), context.previous);
            }
            if (error instanceof ApiError) {
                toast.error(i18n.t('errors.user.deactivateFailed'), error.message);
            }
            else {
                toast.error(i18n.t('errors.user.deactivateFailed'), i18n.t('errors.generic.unexpected'));
            }
        },
        onSuccess: () => {
            toast.success(i18n.t('profile.employee.actions.deactivateTitle'), i18n.t('profile.employee.actions.deactivateDescription'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: employeesKeys.lists() });
        },
    });
    return {
        deleteEmployee: (id) => mutation.mutate(id),
        deleteEmployeeAsync: (id) => mutation.mutateAsync(id),
        isPending: mutation.isPending,
    };
}
