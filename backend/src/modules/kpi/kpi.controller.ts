import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { KpiService } from './kpi.service.js';
import { KpiRepository } from './kpi.repository.js';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import {
  createKpiSchema,
  updateKpiSchema,
  recordKpiProgressSchema,
  kpiIdParamSchema,
} from './kpi.schema.js';

export async function kpiRoutes(app: FastifyInstance): Promise<void> {
  const kpiRepository = new KpiRepository(app.db);
  const kpiService = new KpiService(kpiRepository);

  const authenticate = app.authenticate;

  app.get(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const kpis = await kpiService.listKpis(request.user.tenantId);
      return reply.send(kpis);
    }
  );

  app.get(
    '/:kpiId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { kpiId } = kpiIdParamSchema.parse(request.params);
      const kpi = await kpiService.getKpiById(kpiId, request.user.tenantId);
      return reply.send(kpi);
    }
  );

  app.post(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createKpiSchema.parse(request.body);
      const kpi = await kpiService.createKpi(request.user.tenantId, request.user.userId, body);
      return reply.status(201).send(kpi);
    }
  );

  app.patch(
    '/:kpiId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { kpiId } = kpiIdParamSchema.parse(request.params);
      const body = updateKpiSchema.parse(request.body);
      const kpi = await kpiService.updateKpi(kpiId, request.user.tenantId, body);
      return reply.send(kpi);
    }
  );

  app.delete(
    '/:kpiId',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { kpiId } = kpiIdParamSchema.parse(request.params);
      await kpiService.deleteKpi(kpiId, request.user.tenantId);
      return reply.status(204).send();
    }
  );

  // Sub-resource: progress entries for a KPI
  app.post(
    '/:kpiId/progress',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { kpiId } = kpiIdParamSchema.parse(request.params);
      const body = recordKpiProgressSchema.parse(request.body);
      const progress = await kpiService.recordProgress(kpiId, request.user.tenantId, body);
      return reply.status(201).send(progress);
    }
  );

  app.get(
    '/:kpiId/progress',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { kpiId } = kpiIdParamSchema.parse(request.params);
      const progress = await kpiService.getKpiProgress(kpiId, request.user.tenantId);
      return reply.send(progress);
    }
  );
}
