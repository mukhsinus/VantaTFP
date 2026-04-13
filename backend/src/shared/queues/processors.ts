import { Pool } from 'pg';
import { Job } from 'bullmq';
import { redis } from '../../config/redis.js';
import { createWorker } from './bullmq.js';
import {
  QUEUE_NAMES,
  RecalculateKpiJobPayload,
  RecalculatePayrollJobPayload,
} from './queue-types.js';
import { env } from '../utils/env.js';
import { KpiRepository } from '../../modules/kpi/kpi.repository.js';
import { KpiService } from '../../modules/kpi/kpi.service.js';
import { PayrollRepository } from '../../modules/payroll/payroll.repository.js';
import { PayrollService } from '../../modules/payroll/payroll.service.js';
import { logger } from '../utils/logger.js';

const pool = new Pool({ connectionString: env.DATABASE_URL });

const payrollService = new PayrollService(new PayrollRepository(pool));
const kpiService = new KpiService(new KpiRepository(pool), payrollService);

async function processKpiRecalculation(job: Job<RecalculateKpiJobPayload>): Promise<void> {
  const { tenantId, userId, periodStart, periodEnd } = job.data;
  logger.info({ tenantId, userId, periodStart, periodEnd }, '[KPI worker] Processing KPI recalculation');
  await kpiService.calculateKPI(userId, tenantId, periodStart, periodEnd);
}

/**
 * Dedicated payroll recalculation processor — completes the event chain:
 * task.completed -> kpi.recalculate -> payroll.recalculate -> notification.send
 */
async function processPayrollRecalculation(job: Job<RecalculatePayrollJobPayload>): Promise<void> {
  const { tenantId, userId, periodStart, periodEnd } = job.data;
  logger.info(
    { tenantId, userId, periodStart, periodEnd },
    '[Payroll worker] Processing payroll recalculation'
  );
  await payrollService.calculatePayroll(userId, tenantId, periodStart, periodEnd);
}

export function startQueueProcessors() {
  const kpiWorker = createWorker<RecalculateKpiJobPayload>(
    QUEUE_NAMES.KPI_RECALCULATION,
    processKpiRecalculation
  );

  const payrollWorker = createWorker<RecalculatePayrollJobPayload>(
    QUEUE_NAMES.PAYROLL_RECALCULATION,
    processPayrollRecalculation
  );

  return {
    workers: [kpiWorker, payrollWorker],
    async close(): Promise<void> {
      await Promise.all([kpiWorker.close(), payrollWorker.close()]);
      await redis.quit().catch(() => undefined);
      await pool.end();
    },
  };
}
