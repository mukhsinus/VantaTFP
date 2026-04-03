import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@entities/task/task.api';
import { mapTaskDtoToUiModel } from '@entities/task/task.mapper';
import type { CreateTaskPayload, TaskUiModel } from '@entities/task/task.types';
import { toast } from '@app/store/toast.store';
import { ApiError } from '@shared/api/client';
import { taskKeys } from './task.query-keys';

interface UseCreateTaskResult {
  createTask: (payload: CreateTaskPayload) => Promise<TaskUiModel>;
  isPending: boolean;
}

export function useCreateTask(): UseCreateTaskResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: taskApi.create,

    onSuccess: (createdDto) => {
      // Invalidate all task lists so every active query re-fetches
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success(
        'Task created',
        `"${createdDto.title}" has been added.`
      );
    },

    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error('Failed to create task', error.message);
      } else {
        toast.error('Failed to create task', 'An unexpected error occurred.');
      }
    },
  });

  const createTask = async (payload: CreateTaskPayload): Promise<TaskUiModel> => {
    const dto = await mutation.mutateAsync(payload);
    return mapTaskDtoToUiModel(dto);
  };

  return {
    createTask,
    isPending: mutation.isPending,
  };
}
