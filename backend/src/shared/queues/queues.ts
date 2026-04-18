import { createQueue } from './bullmq.js';
import {
  QUEUE_NAMES,
  RecalculateKpiJobPayload,
  RecalculatePayrollJobPayload,
} from './queue-types.js';

// Lazily instantiate queues to avoid attempting to connect to Redis at module
// import time. Callers should use the enqueue helpers which will create the
// queue on first use. The app shutdown hook will close queues if they've been
// created.
let _kpiRecalculationQueue = null;
let _payrollRecalculationQueue = null;

export function getKpiRecalculationQueue() {
  if (!_kpiRecalculationQueue) {
    _kpiRecalculationQueue = createQueue<RecalculateKpiJobPayload>(
      QUEUE_NAMES.KPI_RECALCULATION
    );
  }
  return _kpiRecalculationQueue;
}

export function getPayrollRecalculationQueue() {
  if (!_payrollRecalculationQueue) {
    _payrollRecalculationQueue = createQueue<RecalculatePayrollJobPayload>(
      QUEUE_NAMES.PAYROLL_RECALCULATION
    );
  }
  return _payrollRecalculationQueue;
}

export async function enqueueKpiRecalculation(payload: RecalculateKpiJobPayload): Promise<void> {
  const q = getKpiRecalculationQueue();
  await q.add(
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
  const q = getPayrollRecalculationQueue();
  await q.add(
    'recalculate-payroll',
    payload,
    {
      jobId: `payroll:${payload.tenantId}:${payload.userId}:${payload.periodStart}:${payload.periodEnd}`,
    }
  );
}
