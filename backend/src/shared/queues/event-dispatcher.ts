import {
  domainEvents,
  DOMAIN_EVENT_TASK_COMPLETED,
  DOMAIN_EVENT_TASK_CREATED,
  DOMAIN_EVENT_TASK_OVERDUE,
} from '../events/domain-events.js';
import { logger } from '../utils/logger.js';
import { enqueueKpiRecalculation, enqueuePayrollRecalculation } from './queues.js';
import { NotificationRepository } from '../../modules/notifications/notification.repository.js';
import { NotificationService } from '../../modules/notifications/notification.service.js';
import { Pool } from 'pg';

function getMonthPeriod(isoDate: string): { periodStart: string; periodEnd: string } {
  const date = new Date(isoDate);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  };
}

let registered = false;

export function registerDomainEventDispatchers(db: Pool): void {
  if (registered) return;
  registered = true;

  const notificationService = new NotificationService(
    new NotificationRepository(db)
  );

  domainEvents.on(DOMAIN_EVENT_TASK_CREATED, async (payload) => {
    if (!payload.assigneeId) return;
    try {
      await notificationService.createAndDispatch({
        tenantId: payload.tenantId,
        userId: payload.assigneeId,
        type: 'TASK_CREATED',
        title: 'New task assigned',
        message: `Task ${payload.taskId} has been created and assigned to you.`,
        payload: {
          taskId: payload.taskId,
          actorUserId: payload.actorUserId,
          status: 'TODO',
          deadline: payload.deadline,
        },
      });
    } catch (error) {
      logger.error({ err: error, payload }, 'Failed to dispatch task created notification');
    }
  });

  domainEvents.on(DOMAIN_EVENT_TASK_OVERDUE, async (payload) => {
    if (!payload.assigneeId) return;
    try {
      await notificationService.createAndDispatch({
        tenantId: payload.tenantId,
        userId: payload.assigneeId,
        type: 'TASK_OVERDUE',
        title: 'Task overdue',
        message: `Task ${payload.taskId} is overdue.`,
        payload: {
          taskId: payload.taskId,
          actorUserId: payload.actorUserId,
          deadline: payload.deadline,
        },
      });
    } catch (error) {
      logger.error({ err: error, payload }, 'Failed to dispatch task overdue notification');
    }
  });

  domainEvents.on(DOMAIN_EVENT_TASK_COMPLETED, async (payload) => {
    if (!payload.assigneeId) return;

    const period = getMonthPeriod(payload.completedAt);

    try {
      await enqueueKpiRecalculation({
        tenantId: payload.tenantId,
        userId: payload.assigneeId,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
      });

      // Complete the event chain: task.completed -> kpi -> payroll -> notification (per spec)
      await enqueuePayrollRecalculation({
        tenantId: payload.tenantId,
        userId: payload.assigneeId,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
      });

      await notificationService.createAndDispatch({
        tenantId: payload.tenantId,
        userId: payload.assigneeId,
        type: 'TASK_COMPLETED',
        title: 'Task completed',
        message: `Task ${payload.taskId} has been completed.`,
        payload: {
          taskId: payload.taskId,
          actorUserId: payload.actorUserId,
          completedAt: payload.completedAt,
          status: 'DONE',
        },
      });
    } catch (error) {
      logger.error(
        {
          err: error,
          tenantId: payload.tenantId,
          userId: payload.assigneeId,
          taskId: payload.taskId,
          period,
        },
        'Failed to enqueue KPI recalculation job'
      );
    }
  });
}
