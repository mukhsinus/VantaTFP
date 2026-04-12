import 'dotenv/config';
import { startQueueProcessors } from './shared/queues/processors.js';
import { logger } from './shared/utils/logger.js';

async function start(): Promise<void> {
  const runtime = startQueueProcessors();
  logger.info('Queue workers started');

  const shutdown = async () => {
    try {
      await runtime.close();
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  logger.error({ err: error }, 'Worker failed to start');
  process.exit(1);
});
