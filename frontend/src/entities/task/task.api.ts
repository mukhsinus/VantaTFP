import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import {
  TaskApiDto,
  TaskListApiResponse,
  CreateTaskPayload,
  UpdateTaskPayload,
  ListTasksParams,
} from './task.types';

/**
 * Low-level API functions for the tasks module.
 * These are the only functions allowed to call apiClient for tasks.
 * React Query hooks consume these — never components directly.
 */

export const taskApi = {
  list: (params?: ListTasksParams): Promise<TaskListApiResponse> =>
    apiClient.get<TaskListApiResponse>(API.tasks.list, params as Record<string, string | number | boolean | undefined | null>),

  create: (payload: CreateTaskPayload): Promise<TaskApiDto> =>
    apiClient.post<TaskApiDto>(API.tasks.list, payload),

  update: (taskId: string, payload: UpdateTaskPayload): Promise<TaskApiDto> =>
    apiClient.patch<TaskApiDto>(API.tasks.update(taskId), payload),

  delete: (taskId: string): Promise<void> =>
    apiClient.delete(API.tasks.detail(taskId)),
};
