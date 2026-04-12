import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '@entities/employees/employees.api';
import { ApiError } from '@shared/api/client';
import { toast } from '@app/store/toast.store';
import i18n from '@shared/i18n/i18n';
import { employeesKeys } from './employees.query-keys';
export function usePatchEmployeeRole() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: ({ id, role }) => employeesApi.patchRole(id, role),
        onMutate: async ({ id, role }) => {
            await queryClient.cancelQueries({ queryKey: employeesKeys.list() });
            const previous = queryClient.getQueryData(employeesKeys.list());
            queryClient.setQueryData(employeesKeys.list(), (old) => {
                if (!old)
                    return old;
                return {
                    ...old,
                    data: old.data.map((e) => (e.id === id ? { ...e, role } : e)),
                };
            });
            return { previous };
        },
        onError: (error, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(employeesKeys.list(), context.previous);
            }
            if (error instanceof ApiError) {
                toast.error(i18n.t('errors.user.updateFailed'), error.message);
            }
            else {
                toast.error(i18n.t('errors.user.updateFailed'), i18n.t('errors.generic.unexpected'));
            }
        },
        onSuccess: (dto) => {
            queryClient.setQueryData(employeesKeys.list(), (old) => {
                if (!old)
                    return old;
                return {
                    ...old,
                    data: old.data.map((e) => (e.id === dto.id ? { ...e, ...dto } : e)),
                };
            });
            toast.success(i18n.t('errors.user.updated'), i18n.t('employees.toast.roleUpdated', { email: dto.email }));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: employeesKeys.lists() });
        },
    });
    return {
        patchRole: (id, role) => mutation.mutate({ id, role }),
        patchRoleAsync: (id, role) => mutation.mutateAsync({ id, role }),
        isPending: mutation.isPending,
    };
}
