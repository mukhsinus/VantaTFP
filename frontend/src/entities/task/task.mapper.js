import i18n from '@shared/i18n/i18n';
const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
});
/**
 * Maps a raw backend TaskApiDto to a TaskUiModel.
 * All presentation logic (formatting, overdue detection) lives here —
 * components receive clean, ready-to-render data.
 */
export function mapTaskDtoToUiModel(dto) {
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    const now = new Date();
    const isOverdue = dueDate !== null &&
        dueDate < now &&
        dto.status !== 'DONE';
    const assigneeName = dto.assignee
        ? `${dto.assignee.firstName} ${dto.assignee.lastName}`
        : i18n.t('common.states.unassigned');
    return {
        id: dto.id,
        title: dto.title,
        description: dto.description,
        assignee: assigneeName,
        assigneeId: dto.assignee?.id ?? null,
        priority: dto.priority,
        status: dto.status,
        dueDate: dueDate ? dateFormatter.format(dueDate) : i18n.t('common.states.notAvailable'),
        dueDateIso: dto.dueDate,
        overdue: isOverdue,
        createdAt: dto.createdAt,
    };
}
export function mapTaskListDtoToUiModels(dtos) {
    return dtos.map(mapTaskDtoToUiModel);
}
