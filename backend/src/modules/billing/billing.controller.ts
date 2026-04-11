import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { sendSuccess } from '../../shared/utils/response.js';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { requireTenantOwnerStrict } from '../../shared/middleware/rbac.middleware.js';
import { tenantContextMiddleware } from '../../shared/middleware/tenant.middleware.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { BILLING_PLANS_CATALOG } from './billing.service.js';
import { billingUpgradeBodySchema } from './billing.schema.js';

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = app.authenticate;

  app.get(
    '/snapshot',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.user.tenantId;
      if (
        request.user.system_role === 'super_admin' &&
        (!tenantId || tenantId.length === 0)
      ) {
        return sendSuccess(reply, {
          tenantId: '',
          planName: 'platform',
          limits: {
            users: null,
            tasks: null,
            apiRatePerHour: null,
          },
          usage: {
            users: 0,
            tasks: 0,
            apiRatePerHour: 0,
          },
        });
      }
      const plan = await app.billing.getTenantPlan(tenantId);
      const users = await app.billing.checkLimit(tenantId, 'users');
      const tasks = await app.billing.checkLimit(tenantId, 'tasks');
      const apiRate = await app.billing.checkLimit(tenantId, 'api_requests');

      return sendSuccess(reply, {
        tenantId,
        planName: plan.planName,
        limits: {
          users: users.max,
          tasks: tasks.max,
          apiRatePerHour: apiRate.max,
        },
        usage: {
          users: users.current,
          tasks: tasks.current,
          apiRatePerHour: apiRate.current,
        },
      });
    }
  );

  app.get(
    '/current',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.user.tenantId;
      if (
        request.user.system_role === 'super_admin' &&
        (!tenantId || tenantId.length === 0)
      ) {
        return sendSuccess(reply, {
          plan: 'platform',
          status: null,
          trial_ends_at: null,
          users_used: 0,
          users_limit: null,
          tasks_used: 0,
          tasks_limit: null,
          api_used: 0,
          api_limit: null,
        });
      }
      const data = await app.billing.getBillingCurrent(tenantId);
      return sendSuccess(reply, data);
    }
  );

  app.get('/plans', async (_request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, BILLING_PLANS_CATALOG);
  });

  app.post(
    '/upgrade',
    {
      preHandler: [authenticate, tenantContextMiddleware, requireTenantOwnerStrict()],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId ?? request.user.tenant_id ?? request.user.tenantId;
      if (!tenantId || String(tenantId).trim().length === 0) {
        throw ApplicationError.forbidden('Tenant context required');
      }
      const body = billingUpgradeBodySchema.parse(request.body ?? {});
      await app.billing.upgradeSubscriptionPlan(tenantId, body.plan);
      return sendSuccess(reply, { ok: true });
    }
  );
}
