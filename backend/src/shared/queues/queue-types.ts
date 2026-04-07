export const QUEUE_NAMES = {
  KPI_RECALCULATION: 'kpi-recalculation',
  PAYROLL_RECALCULATION: 'payroll-recalculation',
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
