import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { KpiService } from './kpi.service.js';
import { KpiRepository } from './kpi.repository.js';
import { PayrollRepository } from '../payroll/payroll.repository.js';
import { PayrollService } from '../payroll/payroll.service.js';
import { requireRole } from '../../shared/middleware/rbac.middleware.js';
import { sendSuccess } from '../../shared/utils/response.js';
import {
  kpiAnalyticsQuerySchema,
  kpiCalculationParamsSchema,
  kpiCalculationQuerySchema,
  kpiIdParamSchema,
  listKpiQuerySchema,
} from './kpi.schema.js';

export async function kpiRoutes(app: FastifyInstance): Promise<void> {
  const kpiRepository = new KpiRepository(app.db);
  const payrollRepository = new PayrollRepository(app.db);
  const payrollService = new PayrollService(payrollRepository);
  const kpiService = new KpiService(kpiRepository, payrollService);

  const authenticate = app.authenticate;
  const canReadKpi = requireRole('read', 'kpi');
  const canWriteKpi = requireRole('write', 'kpi');

  app.get(
    '/analytics/by-employee',
    { preHandler: [authenticate, canReadKpi] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = kpiAnalyticsQuerySchema.parse(request.query);
      const result = await kpiService.getAnalyticsByEmployee(
        request.user.tenantId,
        query,
        { userId: request.user.userId, role: request.user.role }
      );
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/analytics/aggregated',
    { preHandler: [authenticate, canReadKpi] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = kpiAnalyticsQuerySchema.parse(request.query);
      const result = await kpiService.getAnalyticsAggregated(
        request.user.tenantId,
        query,
        { userId: request.user.userId, role: request.user.role }
      );
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/calculate/:userId',
    { preHandler: [authenticate, canWriteKpi] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = kpiCalculationParamsSchema.parse(request.params);
      const { periodStart, periodEnd } = kpiCalculationQuerySchema.parse(request.query);
      const result = await kpiService.calculateKPI(
        userId,
        request.user.tenantId,
        periodStart,
        periodEnd
      );
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/',
    { preHandler: [authenticate, canReadKpi] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listKpiQuerySchema.parse(request.query);
      const result = await kpiService.listKpisPaginated(request.user.tenantId, query.page, query.limit);
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/:kpiId',
    { preHandler: [authenticate, canReadKpi] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { kpiId } = kpiIdParamSchema.parse(request.params);
      const kpi = await kpiService.getKpiById(kpiId, request.user.tenantId);
      return sendSuccess(reply, kpi);
    }
  );

  app.get(
    '/:kpiId/progress',
    { preHandler: [authenticate, canReadKpi] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { kpiId } = kpiIdParamSchema.parse(request.params);
      const progress = await kpiService.getKpiProgress(kpiId, request.user.tenantId);
      return sendSuccess(reply, progress);
    }
  );
}
