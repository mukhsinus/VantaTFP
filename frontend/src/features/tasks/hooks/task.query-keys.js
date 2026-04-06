/**
 * Centralized query key factory for tasks.
 * Every hook uses these — guarantees cache invalidations are precise.
 */
export const taskKeys = {
    /** Root key — invalidate to bust all task caches */
    all: ['tasks'],
    /** List queries (with optional filters) */
    lists: () => [...taskKeys.all, 'list'],
    list: (params = {}) => [...taskKeys.lists(), params],
    /** Single task detail */
    details: () => [...taskKeys.all, 'detail'],
    detail: (taskId) => [...taskKeys.details(), taskId],
};
