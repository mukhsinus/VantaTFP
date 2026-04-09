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
