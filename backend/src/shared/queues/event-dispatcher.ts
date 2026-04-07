import { domainEvents, DOMAIN_EVENT_TASK_COMPLETED } from '../events/domain-events.js';
import { logger } from '../utils/logger.js';
import { enqueueKpiRecalculation } from './queues.js';

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

export function registerDomainEventDispatchers(): void {
  if (registered) return;
  registered = true;

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
