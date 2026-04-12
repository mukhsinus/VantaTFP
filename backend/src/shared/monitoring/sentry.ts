import * as Sentry from '@sentry/node';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../utils/env.js';

export function initSentry(): void {
  if (!env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}

export function registerSentryErrorHook(app: FastifyInstance): void {
  if (!env.SENTRY_DSN) {
    return;
  }

  app.addHook(
    'onError',
    async (request: FastifyRequest, _reply: FastifyReply, error: Error) => {
      try {
        const user = request.user as { id?: string; userId?: string; tenantId?: string } | undefined;
        const userId = user?.id ?? user?.userId ?? undefined;
        const tenantId = user?.tenantId ?? request.tenantId ?? undefined;

        Sentry.withScope((scope) => {
          if (userId || tenantId) {
            scope.setUser({
              id: userId,
              tenant_id: tenantId,
            });
          }

          scope.setContext('request', {
            url: request.url,
            method: request.method,
            request_id: request.id,
            tenant_id: tenantId,
          });

          scope.setTag('request_id', request.id);
          if (tenantId) {
            scope.setTag('tenant_id', tenantId);
          }

          Sentry.captureException(error);
        });
      } catch (err) {
        console.error('MIDDLEWARE ERROR:', err);
        throw err;
      }
    }
  );
}
