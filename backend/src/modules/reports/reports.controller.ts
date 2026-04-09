import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { ReportsRepository } from './reports.repository.js';
import { ReportsService } from './reports.service.js';
import {
  exportReportSchema,
  generateReportSchema,
  listReportHistorySchema,
} from './reports.schema.js';

export async function reportsRoutes(app: FastifyInstance): Promise<void> {
  const reportsRepository = new ReportsRepository(app.db);
  const reportsService = new ReportsService(reportsRepository);
  const authenticate = app.authenticate;

  app.post(
    '/generate',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = generateReportSchema.parse(request.body);
      const result = await reportsService.generateReport(
        request.user.tenantId,
        { userId: request.user.userId, role: request.user.role },
        body
      );
      return sendSuccess(reply, result, 201);
    }
  );

  app.post(
    '/export',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = exportReportSchema.parse(request.body);
      const file = await reportsService.exportReport(
        request.user.tenantId,
        { userId: request.user.userId, role: request.user.role },
        body
      );
      reply.header('Content-Type', file.contentType);
      reply.header('Content-Disposition', `attachment; filename="${file.filename}"`);
      return reply.send(file.body);
    }
  );

  app.get(
    '/history',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listReportHistorySchema.parse(request.query);
      const history = await reportsService.listHistory(request.user.tenantId, query);
      return sendSuccess(reply, history);
    }
  );
}
