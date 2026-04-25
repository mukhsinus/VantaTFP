import { Pool } from 'pg';
import { Job } from 'bullmq';
import { redis } from '../../config/redis.js';
import { createQueue, createWorker } from './bullmq.js';
import {
  QUEUE_NAMES,
  RecalculateKpiJobPayload,
  RecalculatePayrollJobPayload,
  DeadLetterJobPayload,
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
  const deadLetterQueue = createQueue<DeadLetterJobPayload>(QUEUE_NAMES.DEAD_LETTER);
  const kpiWorker = createWorker<RecalculateKpiJobPayload>(
    QUEUE_NAMES.KPI_RECALCULATION,
    processKpiRecalculation
  );

  const payrollWorker = createWorker<RecalculatePayrollJobPayload>(
    QUEUE_NAMES.PAYROLL_RECALCULATION,
    processPayrollRecalculation
  );

  const attachDlqHandler = (queueName: string, worker: { on: (event: 'failed', cb: (job: Job | undefined, error: Error) => void) => void }) => {
    worker.on('failed', (job, error) => {
      if (!job) {
        logger.error({ queueName, err: error }, '[Queue worker] failed without job payload');
        return;
      }
      const payload: DeadLetterJobPayload = {
        sourceQueue: queueName,
        sourceJobId: String(job.id ?? 'unknown'),
        sourceName: job.name,
        data: job.data,
        failedReason: error.message,
        failedAt: new Date().toISOString(),
      };
      void deadLetterQueue.add(
        `dlq-${queueName}`,
        payload,
        {
          jobId: `dlq:${queueName}:${String(job.id ?? Date.now())}`,
        }
      );
      logger.error(
        { queueName, jobId: job.id, err: error, attemptsMade: job.attemptsMade },
        '[Queue worker] job moved to DLQ'
      );
    });
  };

  attachDlqHandler(QUEUE_NAMES.KPI_RECALCULATION, kpiWorker);
  attachDlqHandler(QUEUE_NAMES.PAYROLL_RECALCULATION, payrollWorker);

  return {
    workers: [kpiWorker, payrollWorker],
    async close(): Promise<void> {
      await Promise.all([kpiWorker.close(), payrollWorker.close()]);
      await deadLetterQueue.close().catch(() => undefined);
      await redis.quit().catch(() => undefined);
      await pool.end();
    },
  };
}
