import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@entities/task/task.api';
import { mapTaskDtoToUiModel } from '@entities/task/task.mapper';
import { toast } from '@app/store/toast.store';
import { ApiError } from '@shared/api/client';
import i18n from '@shared/i18n/i18n';
import { taskKeys } from './task.query-keys';
export function useCreateTask() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: taskApi.create,
        onSuccess: (createdDto) => {
            // Invalidate all task lists so every active query re-fetches
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
            toast.success(i18n.t('errors.task.created'), i18n.t('errors.task.addedDescription', { title: createdDto.title }));
        },
        onError: (error) => {
            if (error instanceof ApiError) {
                toast.error(i18n.t('errors.task.createFailed'), error.message);
            }
            else {
                toast.error(i18n.t('errors.task.createFailed'), i18n.t('errors.generic.unexpected'));
            }
        },
    });
    const createTask = async (payload) => {
        const dto = await mutation.mutateAsync(payload);
        return mapTaskDtoToUiModel(dto);
    };
    return {
        createTask,
        isPending: mutation.isPending,
    };
}
