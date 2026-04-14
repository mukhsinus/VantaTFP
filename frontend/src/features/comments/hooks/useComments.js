import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '@entities/comment/comment.api';
export const commentKeys = {
    all: ['comments'],
    byTask: (taskId) => [...commentKeys.all, taskId],
};
export function useComments(taskId, params = {}) {
    return useQuery({
        queryKey: [...commentKeys.byTask(taskId), params],
        queryFn: () => commentApi.list(taskId, params),
        enabled: !!taskId,
    });
}
export function useCreateComment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, payload }) => commentApi.create(taskId, payload),
        onSuccess: (_, { taskId }) => qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) }),
    });
}
export function useUpdateComment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, commentId, payload }) => commentApi.update(taskId, commentId, payload),
        onSuccess: (_, { taskId }) => qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) }),
    });
}
export function useDeleteComment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, commentId }) => commentApi.delete(taskId, commentId),
        onSuccess: (_, { taskId }) => qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) }),
    });
}
