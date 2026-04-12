import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@entities/user/users.api';
import { mapUserDtoToUiModel } from '@entities/user/users.mapper';
import { toast } from '@app/store/toast.store';
import { ApiError } from '@shared/api/client';
import i18n from '@shared/i18n/i18n';
import { usersKeys } from './users.query-keys';
import { employeesKeys } from '@features/employees/hooks/employees.query-keys';
export function useCreateUser() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: usersApi.createUser,
        onSuccess: (dto) => {
            queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: employeesKeys.lists() });
            toast.success(i18n.t('errors.user.created'), i18n.t('errors.user.addedDescription', { fullName: `${dto.firstName} ${dto.lastName}` }));
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
        createUser: async (payload) => mapUserDtoToUiModel(await mutation.mutateAsync(payload)),
        isPending: mutation.isPending,
    };
}
