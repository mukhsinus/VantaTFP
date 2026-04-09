import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { sendSuccess } from '../../shared/utils/response.js';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';

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
}
