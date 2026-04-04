import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import { env } from './shared/utils/env.js';
import { registerErrorHandler } from './shared/middleware/error-handler.middleware.js';

// Plugins
import databasePlugin from './plugins/database.plugin.js';
import corsPlugin from './plugins/cors.plugin.js';
import helmetPlugin from './plugins/helmet.plugin.js';
import sensiblePlugin from './plugins/sensible.plugin.js';
import jwtPlugin from './plugins/jwt.plugin.js';
import rateLimitPlugin from './plugins/rate-limit.plugin.js';

// Module routes
import { authRoutes } from './modules/auth/auth.controller.js';
import { usersRoutes } from './modules/users/users.controller.js';
import { tenantsRoutes } from './modules/tenants/tenants.controller.js';
import { tasksRoutes } from './modules/tasks/tasks.controller.js';
import { kpiRoutes } from './modules/kpi/kpi.controller.js';
import { payrollRoutes } from './modules/payroll/payroll.controller.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    bodyLimit: 1_048_576, // 1MB max request body size to prevent DoS attacks
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
          : undefined,
    },
  });

  // ── Infrastructure plugins ────────────────────────────────────────────────
  await app.register(helmetPlugin);
  await app.register(corsPlugin);
  await app.register(sensiblePlugin);
  await app.register(databasePlugin);
  await app.register(jwtPlugin);
  await app.register(rateLimitPlugin);

  // ── Centralized error handler ─────────────────────────────────────────────
  registerErrorHandler(app);

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // ── Module routes (all prefixed under /api/v1) ────────────────────────────
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(usersRoutes, { prefix: '/api/v1/users' });
  await app.register(tenantsRoutes, { prefix: '/api/v1/tenants' });
  await app.register(tasksRoutes, { prefix: '/api/v1/tasks' });
  await app.register(kpiRoutes, { prefix: '/api/v1/kpi' });
  await app.register(payrollRoutes, { prefix: '/api/v1/payroll' });

  return app;
}
