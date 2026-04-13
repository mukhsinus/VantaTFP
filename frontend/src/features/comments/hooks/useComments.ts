import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '@entities/comment/comment.api';
import type { CreateCommentPayload, UpdateCommentPayload } from '@entities/comment/comment.types';

export const commentKeys = {
  all: ['comments'] as const,
  byTask: (taskId: string) => [...commentKeys.all, taskId] as const,
};

export function useComments(taskId: string, params: Record<string, string | number | boolean | null | undefined> = {}) {
  return useQuery({
    queryKey: [...commentKeys.byTask(taskId), params],
    queryFn: () => commentApi.list(taskId, params),
    enabled: !!taskId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: CreateCommentPayload }) =>
      commentApi.create(taskId, payload),
    onSuccess: (_, { taskId }) => qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) }),
  });
}

export function useUpdateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, commentId, payload }: { taskId: string; commentId: string; payload: UpdateCommentPayload }) =>
      commentApi.update(taskId, commentId, payload),
    onSuccess: (_, { taskId }) => qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) }),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, commentId }: { taskId: string; commentId: string }) =>
      commentApi.delete(taskId, commentId),
    onSuccess: (_, { taskId }) => qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) }),
  });
}
