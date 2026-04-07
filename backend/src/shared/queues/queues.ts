import { createQueue } from './bullmq.js';
import {
  QUEUE_NAMES,
  RecalculateKpiJobPayload,
  RecalculatePayrollJobPayload,
} from './queue-types.js';

export const kpiRecalculationQueue = createQueue<RecalculateKpiJobPayload>(
  QUEUE_NAMES.KPI_RECALCULATION
);

export const payrollRecalculationQueue = createQueue<RecalculatePayrollJobPayload>(
  QUEUE_NAMES.PAYROLL_RECALCULATION
);

export async function enqueueKpiRecalculation(payload: RecalculateKpiJobPayload): Promise<void> {
  await kpiRecalculationQueue.add(
    'recalculate-kpi',
    payload,
    {
      jobId: `kpi:${payload.tenantId}:${payload.userId}:${payload.periodStart}:${payload.periodEnd}`,
    }
  );
}

export async function enqueuePayrollRecalculation(
  payload: RecalculatePayrollJobPayload
): Promise<void> {
  await payrollRecalculationQueue.add(
    'recalculate-payroll',
    payload,
    {
      jobId: `payroll:${payload.tenantId}:${payload.userId}:${payload.periodStart}:${payload.periodEnd}`,
    }
  );
}
