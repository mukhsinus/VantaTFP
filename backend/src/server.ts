import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './shared/utils/env.js';

import process from 'node:process';

let app: Awaited<ReturnType<typeof buildApp>> | null = null;
let shuttingDown = false;

/**
 * Bootstraps and starts the Fastify server
 */
async function start(): Promise<void> {
  try {
    app = await buildApp();

    // --- Request lifecycle hooks (structured logging) ---
    app.addHook('onRequest', async (request) => {
      request.log.info(
        {
          method: request.method,
          url: request.url,
          id: request.id,
        },
        'incoming request'
      );
    });

    app.addHook('onResponse', async (request, reply) => {
      request.log.info(
        {
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
          id: request.id,
        },
        'request completed'
      );
    });

    app.addHook('onError', async (request, _reply, error) => {
      request.log.error(
        {
          err: error,
          id: request.id,
        },
        'request error'
      );
    });

    const PORT = env.PORT;
    const HOST = env.HOST;

    await app.listen({ port: PORT, host: HOST });

    app.log.info({ port: PORT, host: HOST, pid: process.pid }, 'server started');
  } catch (err) {
    // Startup failure (port in use, bad config, etc.)
    if ((err as any)?.code === 'EADDRINUSE') {
      console.error(`Port already in use: ${env.PORT}`);
    } else {
      console.error('Startup failure:', err);
    }

    process.exitCode = 1;
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: 'SIGINT' | 'SIGTERM'): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  const timeoutMs = Number(env.SHUTDOWN_TIMEOUT_MS ?? 10000);
  const timeout = setTimeout(() => {
    (app?.log ?? console).error('Forced shutdown after timeout');
    process.exit(1);
  }, timeoutMs).unref();

  try {
    if (app) {
      app.log.info({ signal }, 'shutting down');
      await app.close();
    }
  } catch (err) {
    (app?.log ?? console).error('Error during shutdown:', err);
  } finally {
    clearTimeout(timeout);
    process.exit(0);
  }
}

/**
 * Global process-level error handling
 */
process.on('unhandledRejection', (reason) => {
  (app?.log ?? console).error('UNHANDLED REJECTION:', reason);
  process.exitCode = 1;
});

process.on('uncaughtException', (error) => {
  (app?.log ?? console).error('UNCAUGHT EXCEPTION:', error);
  process.exit(1); // unsafe state → must exit
});

/**
 * OS signals (macOS, Linux, Docker, etc.)
 */
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

/**
 * Start server safely
 */
start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});