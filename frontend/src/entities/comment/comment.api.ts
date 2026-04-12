import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { CommentApiDto, CommentListResponse, CreateCommentPayload, UpdateCommentPayload } from './comment.types';

export const commentApi = {
  list: (taskId: string, params?: Record<string, unknown>): Promise<CommentListResponse> =>
    apiClient.get<CommentListResponse>(API.comments.list(taskId), params),

  create: (taskId: string, payload: CreateCommentPayload): Promise<CommentApiDto> =>
    apiClient.post<CommentApiDto>(API.comments.list(taskId), payload),

  update: (taskId: string, commentId: string, payload: UpdateCommentPayload): Promise<CommentApiDto> =>
    apiClient.patch<CommentApiDto>(API.comments.detail(taskId, commentId), payload),

  delete: (taskId: string, commentId: string): Promise<void> =>
    apiClient.delete(API.comments.detail(taskId, commentId)) as Promise<void>,
};
