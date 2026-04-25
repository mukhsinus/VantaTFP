export const QUEUE_NAMES = {
  KPI_RECALCULATION: 'kpi-recalculation',
  PAYROLL_RECALCULATION: 'payroll-recalculation',
  DEAD_LETTER: 'dead-letter',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface RecalculateKpiJobPayload {
  tenantId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
}

export interface RecalculatePayrollJobPayload {
  tenantId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
}

export interface DeadLetterJobPayload {
  sourceQueue: string;
  sourceJobId: string;
  sourceName: string;
  data: unknown;
  failedReason: string;
  failedAt: string;
}
