import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelApi } from '@entities/label/label.api';
import type { CreateLabelPayload, UpdateLabelPayload } from '@entities/label/label.types';

export const labelKeys = {
  all: ['labels'] as const,
  list: () => [...labelKeys.all, 'list'] as const,
  taskLabels: (taskId: string) => [...labelKeys.all, 'task', taskId] as const,
};

export function useLabels() {
  return useQuery({
    queryKey: labelKeys.list(),
    queryFn: () => labelApi.list(),
  });
}

export function useTaskLabels(taskId: string) {
  return useQuery({
    queryKey: labelKeys.taskLabels(taskId),
    queryFn: () => labelApi.getTaskLabels(taskId),
    enabled: !!taskId,
  });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLabelPayload) => labelApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: labelKeys.list() }),
  });
}

export function useUpdateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ labelId, payload }: { labelId: string; payload: UpdateLabelPayload }) =>
      labelApi.update(labelId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: labelKeys.list() }),
  });
}

export function useDeleteLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (labelId: string) => labelApi.delete(labelId),
    onSuccess: () => qc.invalidateQueries({ queryKey: labelKeys.list() }),
  });
}

export function useSetTaskLabels() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, labelIds }: { taskId: string; labelIds: string[] }) =>
      labelApi.setTaskLabels(taskId, labelIds),
    onSuccess: (_, { taskId }) => qc.invalidateQueries({ queryKey: labelKeys.taskLabels(taskId) }),
  });
}
