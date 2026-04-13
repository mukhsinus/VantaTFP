import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { sendSuccess } from '../../shared/utils/response.js';
import {
  requireAuth,
  requireTenant,
  requireTenantOwnerStrict,
} from '../../shared/middleware/rbac.middleware.js';
import { tenantContextMiddleware } from '../../shared/middleware/tenant.middleware.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { BILLING_PLANS_CATALOG } from './billing.service.js';
import { billingUpgradeBodySchema } from './billing.schema.js';

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = app.authenticate;

  app.get(
    '/snapshot',
    { preHandler: [authenticate, requireAuth, requireTenant] },
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
    { preHandler: [authenticate, requireAuth, requireTenant] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.user.tenantId;
      if (
        request.user.system_role === 'super_admin' &&
        (!tenantId || tenantId.length === 0)
      ) {
        return sendSuccess(reply, {
          plan: { id: 'platform', name: 'platform' },
          limits: {
            users: null,
            tasks: null,
            api_rate_per_hour: null,
          },
          usage: {
            users: 0,
            tasks: 0,
            api_requests: 0,
          },
          status: null,
          trial_ends_at: null,
          pending_payment: null,
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
      preHandler: [authenticate, requireAuth, tenantContextMiddleware, requireTenantOwnerStrict()],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId ?? request.user.tenant_id ?? request.user.tenantId;
      if (!tenantId || String(tenantId).trim().length === 0) {
        throw ApplicationError.forbidden('Tenant context required');
      }
      const body = billingUpgradeBodySchema.parse(request.body ?? {});
      const paymentRequest = await app.billing.createUpgradePaymentRequest(
        tenantId,
        request.user.id,
        body.plan
      );
      return sendSuccess(reply, {
        ok: true,
        payment_request: paymentRequest,
      });
    }
  );
}
