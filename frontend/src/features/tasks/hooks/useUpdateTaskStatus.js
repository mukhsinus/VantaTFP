import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@entities/task/task.api';
import { toast } from '@app/store/toast.store';
import { ApiError } from '@shared/api/client';
import { taskKeys } from './task.query-keys';
export function useUpdateTaskStatus() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: ({ taskId, status }) => taskApi.update(taskId, { status }),
        // Optimistic update — immediately reflect the change in the UI
        onMutate: async ({ taskId, status }) => {
            // Cancel any in-flight refetches for task lists
            await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
            // Snapshot all list cache entries so we can roll back
            const previousSnapshots = queryClient.getQueriesData({
                queryKey: taskKeys.lists(),
            });
            // Apply the optimistic status change to every cached list
            queryClient.setQueriesData({ queryKey: taskKeys.lists() }, (old) => {
                if (!old)
                    return old;
                return {
                    ...old,
                    data: old.data.map((t) => t.id === taskId ? { ...t, status } : t),
                };
            });
            return { previousSnapshots };
        },
        onError: (error, variables, context) => {
            // Roll back the optimistic update
            if (context?.previousSnapshots) {
                context.previousSnapshots.forEach(([queryKey, snapshot]) => {
                    queryClient.setQueryData(queryKey, snapshot);
                });
            }
            const message = error instanceof ApiError ? error.message : 'An unexpected error occurred.';
            toast.error('Failed to update status', variables.taskTitle ? `"${variables.taskTitle}": ${message}` : message);
        },
        onSettled: () => {
            // Always re-sync with the server after optimistic update
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
        },
    });
    return {
        updateStatus: (variables) => mutation.mutate(variables),
        isPending: mutation.isPending,
    };
}
