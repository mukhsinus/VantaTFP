import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelApi } from '@entities/label/label.api';
export const labelKeys = {
    all: ['labels'],
    list: () => [...labelKeys.all, 'list'],
    taskLabels: (taskId) => [...labelKeys.all, 'task', taskId],
};
export function useLabels() {
    return useQuery({
        queryKey: labelKeys.list(),
        queryFn: () => labelApi.list(),
    });
}
export function useTaskLabels(taskId) {
    return useQuery({
        queryKey: labelKeys.taskLabels(taskId),
        queryFn: () => labelApi.getTaskLabels(taskId),
        enabled: !!taskId,
    });
}
export function useCreateLabel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => labelApi.create(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: labelKeys.list() }),
    });
}
export function useUpdateLabel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ labelId, payload }) => labelApi.update(labelId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: labelKeys.list() }),
    });
}
export function useDeleteLabel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (labelId) => labelApi.delete(labelId),
        onSuccess: () => qc.invalidateQueries({ queryKey: labelKeys.list() }),
    });
}
export function useSetTaskLabels() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, labelIds }) => labelApi.setTaskLabels(taskId, labelIds),
        onSuccess: (_, { taskId }) => qc.invalidateQueries({ queryKey: labelKeys.taskLabels(taskId) }),
    });
}
