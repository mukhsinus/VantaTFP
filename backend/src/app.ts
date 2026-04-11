import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import { env } from './shared/utils/env.js';
import { registerErrorHandler } from './shared/middleware/error-handler.middleware.js';
import { registerRequestLogger } from './shared/middleware/request-logger.middleware.js';
import { fastifyLoggerOptions } from './shared/utils/logger.js';
import { initSentry, registerSentryErrorHook } from './shared/monitoring/sentry.js';

// Plugins
import databasePlugin from './plugins/database.plugin.js';
import billingPlugin from './plugins/billing.plugin.js';
import policyPlugin from './plugins/policy.plugin.js';
import websocketPlugin from './plugins/websocket.plugin.js';
import notificationsPlugin from './plugins/notifications.plugin.js';
import corsPlugin from './plugins/cors.plugin.js';
import helmetPlugin from './plugins/helmet.plugin.js';
import sensiblePlugin from './plugins/sensible.plugin.js';
import jwtPlugin from './plugins/jwt.plugin.js';
import rateLimitPlugin from './plugins/rate-limit.plugin.js';
import { registerDomainEventDispatchers } from './shared/queues/event-dispatcher.js';
import { startOverdueTasksScheduler } from './shared/schedulers/overdue-tasks.scheduler.js';

// Module routes
import { authRoutes } from './modules/auth/auth.controller.js';
import { usersRoutes } from './modules/users/users.controller.js';
import { tenantsRoutes } from './modules/tenants/tenants.controller.js';
import { tasksRoutes } from './modules/tasks/tasks.controller.js';
import { kpiRoutes } from './modules/kpi/kpi.controller.js';
import { payrollRoutes } from './modules/payroll/payroll.controller.js';
import { reportsRoutes } from './modules/reports/reports.controller.js';
import { billingRoutes } from './modules/billing/billing.controller.js';
import { rbacRoutes } from './modules/rbac/rbac.controller.js';
import { notificationRoutes } from './modules/notifications/notification.controller.js';
import { adminRoutes } from './modules/admin/admin.controller.js';
import { platformRoutes } from './modules/platform/platform.controller.js';
import { employeesRoutes } from './modules/employees/employees.controller.js';
import { invitesRoutes } from './modules/invites/invites.controller.js';

export async function buildApp(): Promise<FastifyInstance> {
  initSentry();

  const app = Fastify({
    bodyLimit: 1_048_576, // 1MB max request body size to prevent DoS attacks
    logger: fastifyLoggerOptions,
    disableRequestLogging: true,
  });

  // ── Health check (must stay outside auth/billing/rate limit paths) ───────
  const healthHandler = async () => {
    console.log('Health endpoint ready');
    console.log('Health check hit');
    return { status: 'ok' };
  };
  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  /** Browsers often open PORT (3000) directly; the SPA is served by Vite on 5173, not Fastify. */
  app.get('/', async (_request, reply) => {
    const web =
      process.env.PUBLIC_WEB_APP_URL?.trim() ||
      process.env.FRONTEND_URL?.trim() ||
      'http://localhost:5173';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TFP — API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2.5rem auto; padding: 0 1rem; color: #111; line-height: 1.5; }
    code { background: #f4f4f5; padding: 0.15rem 0.35rem; border-radius: 4px; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>TFP backend is running</h1>
  <p>This URL is the <strong>REST API</strong> (Fastify), not the web app. Open the UI in your browser at:</p>
  <p><a href="${web}">${web}</a></p>
  <p>From the repo: <code>cd frontend && npm run dev</code>, then use the URL Vite prints (usually port <strong>5173</strong>).</p>
  <p>If the UI loads but stays blank, check the browser console. Typical dev issues: <code>localhost</code> vs <code>127.0.0.1</code> for both Vite and <code>CORS_ORIGIN</code>, or <code>VITE_API_BASE_URL</code> pointing at :3000 without matching CORS (Vite defaults to same-origin API in dev unless <code>VITE_DIRECT_API=true</code>).</p>
</body>
</html>`;
    return reply.type('text/html').send(html);
  });

  // ── Infrastructure plugins ────────────────────────────────────────────────
  await app.register(helmetPlugin);
  await app.register(corsPlugin);
  await app.register(sensiblePlugin);
  await app.register(databasePlugin);
  await app.register(billingPlugin);
  await app.register(policyPlugin);
  await app.register(jwtPlugin);
  await app.register(websocketPlugin);
  await app.register(notificationsPlugin);
  await app.register(rateLimitPlugin);
  registerDomainEventDispatchers(app.db);
  const overdueScheduler = startOverdueTasksScheduler({
    db: app.db,
    billing: app.billing,
  });
  app.addHook('onClose', async () => {
    overdueScheduler.stop();
  });
  registerRequestLogger(app);

  // ── Centralized error handler ─────────────────────────────────────────────
  registerSentryErrorHook(app);
  registerErrorHandler(app);

  // ── Module routes (all prefixed under /api/v1) ────────────────────────────
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(usersRoutes, { prefix: '/api/v1/users' });
  await app.register(employeesRoutes, { prefix: '/api/v1/employees' });
  await app.register(invitesRoutes, { prefix: '/api/v1/invites' });
  await app.register(tenantsRoutes, { prefix: '/api/v1/tenants' });
  await app.register(tasksRoutes, { prefix: '/api/v1/tasks' });
  await app.register(kpiRoutes, { prefix: '/api/v1/kpi' });
  await app.register(payrollRoutes, { prefix: '/api/v1/payroll' });
  await app.register(reportsRoutes, { prefix: '/api/v1/reports' });
  await app.register(billingRoutes, { prefix: '/api/v1/billing' });
  await app.register(rbacRoutes, { prefix: '/api/v1/rbac' });
  await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });
  await app.register(platformRoutes, { prefix: '/api/v1/platform' });

  return app;
}
