import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PayrollService } from './payroll.service.js';
import { PayrollRepository } from './payroll.repository.js';
import { requireRole } from '../../shared/middleware/rbac.middleware.js';
import type { AuthenticatedUser } from '../../shared/types/common.types.js';
import { sendSuccess, successEnvelope } from '../../shared/utils/response.js';
import { payrollReadBypassesTenantPolicy } from './payroll.read-access.js';
import { attachIdempotencyKey } from '../../shared/middleware/idempotency.middleware.js';
import { IdempotencyService } from '../../shared/idempotency/idempotency.service.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import {
  payrollIdParamSchema,
  listPayrollQuerySchema,
  createPayrollRuleSchema,
  updatePayrollRuleSchema,
  payrollRuleIdParamSchema,
  applyPayrollRuleBodySchema,
  listPayrollRulesQuerySchema,
  listPayrollRecordsQuerySchema,
} from './payroll.schema.js';

/**
 * Employees must see their own payroll only — list/detail/records routes enforce scope below.
 * Owner/manager still need `read:payroll` from tenant policy (DB).
 */
function requirePayrollSelfReadOrPolicy(
  policyReadPayroll: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
) {
  return async function payrollSelfReadOrPolicyGuard(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) {
      throw ApplicationError.unauthorized();
    }
    if (payrollReadBypassesTenantPolicy(user)) {
      return;
    }
    await policyReadPayroll(request, reply);
  };
}

export async function payrollRoutes(app: FastifyInstance): Promise<void> {
  const payrollRepository = new PayrollRepository(app.db);
  const payrollService = new PayrollService(payrollRepository);
  const idempotency = new IdempotencyService(app.db);

  const authenticate = app.authenticate;
  const canReadPayroll = requireRole('read', 'payroll');
  const canWritePayroll = requireRole('write', 'payroll');
  const canReadPayrollEntries = requirePayrollSelfReadOrPolicy(canReadPayroll);

  app.get(
    '/rules',
    { preHandler: [authenticate, canReadPayroll] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listPayrollRulesQuerySchema.parse(request.query);
      const rules = await payrollService.listPayrollRules(
        request.user.tenantId,
        query.includeInactive
      );
      return sendSuccess(reply, rules);
    }
  );

  app.post(
    '/rules',
    { preHandler: [authenticate, canWritePayroll] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createPayrollRuleSchema.parse(request.body);
      const rule = await payrollService.createPayrollRule(request.user.tenantId, body);
      return sendSuccess(reply, rule, 201);
    }
  );

  app.patch(
    '/rules/:ruleId',
    { preHandler: [authenticate, canWritePayroll] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { ruleId } = payrollRuleIdParamSchema.parse(request.params);
      const body = updatePayrollRuleSchema.parse(request.body);
      const rule = await payrollService.updatePayrollRule(
        ruleId,
        request.user.tenantId,
        body
      );
      return sendSuccess(reply, rule);
    }
  );

  app.post(
    '/rules/:ruleId/apply',
    { preHandler: [authenticate, attachIdempotencyKey, canWritePayroll] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { ruleId } = payrollRuleIdParamSchema.parse(request.params);
      const body = applyPayrollRuleBodySchema.parse(request.body);
      const idempotent = await idempotency.execute(
        request.user.tenantId,
        request.idempotencyKey,
        async () => {
          const result = await payrollService.applyPayrollRule(
            ruleId,
            request.user.tenantId,
            body.userId,
            body.periodStart,
            body.periodEnd
          );
          return {
            response: successEnvelope(result) as unknown as Record<string, unknown>,
            statusCode: 200,
          };
        }
      );
      return reply.status(idempotent.statusCode).send(idempotent.response);
    }
  );

  app.get(
    '/records',
    { preHandler: [authenticate, canReadPayrollEntries] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listPayrollRecordsQuerySchema.parse(request.query);
      const scopedUserId =
        request.user.role === 'EMPLOYEE'
          ? request.user.userId
          : query.userId;
      const result = await payrollService.listPayrollRecordHistory(request.user.tenantId, {
        userId: scopedUserId,
        page: query.page,
        limit: query.limit,
      });
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/',
    { preHandler: [authenticate, canReadPayrollEntries] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listPayrollQuerySchema.parse(request.query);
      const scopedQuery =
        request.user.role === 'EMPLOYEE'
          ? { ...query, employeeId: request.user.userId }
          : query;
      const result = await payrollService.listPayrollEntries(request.user.tenantId, scopedQuery);
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/:payrollId',
    { preHandler: [authenticate, canReadPayrollEntries] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { payrollId } = payrollIdParamSchema.parse(request.params);
      const entry = await payrollService.getPayrollEntryById(payrollId, request.user.tenantId);
      if (request.user.role === 'EMPLOYEE' && entry.employeeId !== request.user.userId) {
        throw ApplicationError.forbidden('You cannot access other employees payroll entries');
      }
      return sendSuccess(reply, entry);
    }
  );

  // Dedicated approve action — semantic clarity over generic PATCH status
  app.post(
    '/:payrollId/approve',
    { preHandler: [authenticate, canWritePayroll] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { payrollId } = payrollIdParamSchema.parse(request.params);
      const entry = await payrollService.approvePayrollEntry(
        payrollId,
        request.user.tenantId,
        request.user.userId
      );
      return sendSuccess(reply, entry);
    }
  );
}
