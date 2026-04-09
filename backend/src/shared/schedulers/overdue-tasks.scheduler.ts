import { Pool } from 'pg';
import { TasksRepository } from '../../modules/tasks/tasks.repository.js';
import { TasksService } from '../../modules/tasks/tasks.service.js';
import type { BillingService } from '../../modules/billing/billing.service.js';
import { logger } from '../utils/logger.js';

const OVERDUE_SCAN_INTERVAL_MS = 5 * 60 * 1000;

export function startOverdueTasksScheduler(params: {
  db: Pool;
  billing: BillingService;
}): { stop: () => void } {
  const tasksService = new TasksService(new TasksRepository(params.db), params.billing);
  let running = false;

  const run = async (): Promise<void> => {
    if (running) {
      return;
    }
    running = true;
    const lockClient = await params.db.connect();
    let lockAcquired = false;
    try {
      const lockResult = await lockClient.query<{ locked: boolean }>(
        `
        SELECT pg_try_advisory_lock(987654321) AS locked
        `
      );
      lockAcquired = Boolean(lockResult.rows[0]?.locked);
      if (!lockAcquired) {
        return;
      }

      const tenants = await params.db.query<{ id: string }>(
        `
        SELECT id
        FROM tenants
        WHERE is_active = TRUE
        `
      );

      let totalEmitted = 0;
      for (const tenant of tenants.rows) {
        const emitted = await tasksService.processOverdueTasksForTenant(tenant.id, {
          limit: 500,
          actorUserId: 'system',
        });
        totalEmitted += emitted;
      }

      if (totalEmitted > 0) {
        logger.info({ totalEmitted }, 'Overdue task scheduler emitted overdue events');
      }
    } catch (error) {
      logger.error({ err: error }, 'Overdue task scheduler run failed');
    } finally {
      try {
        if (lockAcquired) {
          await lockClient.query(
            `
            SELECT pg_advisory_unlock(987654321)
            `
          );
        }
      } catch (unlockError) {
        logger.error({ err: unlockError }, 'Failed to unlock overdue scheduler advisory lock');
      }
      lockClient.release();
      running = false;
    }
  };

  const timer = setInterval(() => {
    void run();
  }, OVERDUE_SCAN_INTERVAL_MS);

  // Trigger an initial pass right after startup.
  void run();

  return {
    stop: () => clearInterval(timer),
  };
}
