import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@entities/task/task.api';
import type { TaskStatus, TaskListApiResponse, TaskUiModel } from '@entities/task/task.types';
import { mapTaskDtoToUiModel } from '@entities/task/task.mapper';
import { toast } from '@app/store/toast.store';
import { ApiError } from '@shared/api/client';
import i18n from '@shared/i18n/i18n';
import { taskKeys } from './task.query-keys';

interface UpdateStatusVariables {
  taskId: string;
  status: TaskStatus;
  /** Optional — used for the optimistic update rollback message */
  taskTitle?: string;
}

interface UseUpdateTaskStatusResult {
  updateStatus: (variables: UpdateStatusVariables) => void;
  isPending: boolean;
}

export function useUpdateTaskStatus(): UseUpdateTaskStatusResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ taskId, status }: UpdateStatusVariables) =>
      taskApi.update(taskId, { status }),

    // Optimistic update — immediately reflect the change in the UI
    onMutate: async ({ taskId, status }) => {
      // Cancel any in-flight refetches for task lists
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot all list cache entries so we can roll back
      const previousSnapshots = queryClient.getQueriesData<TaskListApiResponse>({
        queryKey: taskKeys.lists(),
      });

      // Apply the optimistic status change to every cached list
      queryClient.setQueriesData<TaskListApiResponse>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((t) =>
              t.id === taskId ? { ...t, status } : t
            ),
          };
        }
      );

      return { previousSnapshots };
    },

    onError: (error: unknown, variables, context) => {
      // Roll back the optimistic update
      if (context?.previousSnapshots) {
        context.previousSnapshots.forEach(([queryKey, snapshot]) => {
          queryClient.setQueryData(queryKey, snapshot);
        });
      }

      const message =
        error instanceof ApiError ? error.message : i18n.t('errors.generic.unexpected');
      toast.error(
        i18n.t('errors.task.updateStatusFailed'),
        variables.taskTitle ? `"${variables.taskTitle}": ${message}` : message
      );
    },

    onSettled: () => {
      // Always re-sync with the server after optimistic update
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });

  return {
    updateStatus: (variables) => mutation.mutate(variables),
    isPending:    mutation.isPending,
  };
}
