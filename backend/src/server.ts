import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './shared/utils/env.js';
import { logger } from './shared/utils/logger.js';

let appInstance: Awaited<ReturnType<typeof buildApp>> | null = null;
let isListening = false;
let shuttingDown = false;

async function start(): Promise<void> {
  if (isListening) {
    logger.warn('Server listen already in progress; skipping duplicate start');
    return;
  }
  appInstance = await buildApp();

  appInstance.addHook('onRequest', async (request) => {
    console.log('>>> REQUEST:', request.method, request.url);
  });

  appInstance.addHook('onResponse', async (request, reply) => {
    console.log('<<< RESPONSE:', request.method, request.url, reply.statusCode);
  });

  appInstance.addHook('onError', async (request, _reply, error) => {
    console.error('🔥 ON ERROR:', error);
  });

  const PORT = Number(process.env.PORT) || 3000;

  try {
    await appInstance.listen({ port: PORT, host: env.HOST });
    isListening = true;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'EADDRINUSE') {
      logger.error(
        { port: PORT, host: env.HOST },
        `Backend already running on port ${PORT}. Stop the existing backend instance and retry.`
      );
    } else {
      appInstance.log.error(error);
    }
    process.exit(1);
  }
}

async function shutdown(signal: 'SIGINT' | 'SIGTERM'): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down server');
  try {
    if (appInstance) {
      await appInstance.close();
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed graceful shutdown');
  } finally {
    process.exit(0);
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  logger.error({ reason }, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  logger.error({ err: error }, 'Uncaught exception');
  process.exit(1);
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

start();
