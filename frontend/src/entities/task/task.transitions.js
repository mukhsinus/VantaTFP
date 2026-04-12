/**
 * Allowed status transitions (must match backend `TasksService` / `ALLOWED_STATUS_TRANSITIONS`).
 */
export const TASK_STATUS_ALLOWED_NEXT = {
    TODO: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['IN_REVIEW', 'DONE', 'CANCELLED'],
    IN_REVIEW: ['IN_PROGRESS', 'DONE', 'CANCELLED'],
    DONE: [],
    CANCELLED: [],
};
export function canTransitionTaskStatus(from, to) {
    return TASK_STATUS_ALLOWED_NEXT[from]?.includes(to) ?? false;
}
