import type { ListTasksParams } from '@entities/task/task.types';

/**
 * Centralized query key factory for tasks.
 * Every hook uses these — guarantees cache invalidations are precise.
 */
export const taskKeys = {
  /** Root key — invalidate to bust all task caches */
  all: ['tasks'] as const,

  /** List queries (with optional filters) */
  lists: () => [...taskKeys.all, 'list'] as const,
  list:  (params: ListTasksParams = {}) => [...taskKeys.lists(), params] as const,

  /** Single task detail */
  details: () => [...taskKeys.all, 'detail'] as const,
  detail:  (taskId: string) => [...taskKeys.details(), taskId] as const,
};
