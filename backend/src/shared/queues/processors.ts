import { Pool } from 'pg';
import { Job } from 'bullmq';
import { redis } from '../../config/redis.js';
import { createWorker } from './bullmq.js';
import {
  QUEUE_NAMES,
  RecalculateKpiJobPayload,
} from './queue-types.js';
import { env } from '../utils/env.js';
import { KpiRepository } from '../../modules/kpi/kpi.repository.js';
import { KpiService } from '../../modules/kpi/kpi.service.js';
import { PayrollRepository } from '../../modules/payroll/payroll.repository.js';
import { PayrollService } from '../../modules/payroll/payroll.service.js';

const pool = new Pool({ connectionString: env.DATABASE_URL });

const payrollService = new PayrollService(new PayrollRepository(pool));
const kpiService = new KpiService(new KpiRepository(pool), payrollService);

async function processKpiRecalculation(job: Job<RecalculateKpiJobPayload>): Promise<void> {
  const { tenantId, userId, periodStart, periodEnd } = job.data;
  await kpiService.calculateKPI(userId, tenantId, periodStart, periodEnd);
}

export function startQueueProcessors() {
  const kpiWorker = createWorker<RecalculateKpiJobPayload>(
    QUEUE_NAMES.KPI_RECALCULATION,
    processKpiRecalculation
  );

  return {
    workers: [kpiWorker],
    async close(): Promise<void> {
      await Promise.all([kpiWorker.close()]);
      await redis.quit().catch(() => undefined);
      await pool.end();
    },
  };
}
