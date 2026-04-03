import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PayrollService } from './payroll.service.js';
import { PayrollRepository } from './payroll.repository.js';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import {
  createPayrollEntrySchema,
  updatePayrollEntrySchema,
  payrollIdParamSchema,
  listPayrollQuerySchema,
} from './payroll.schema.js';

export async function payrollRoutes(app: FastifyInstance): Promise<void> {
  const payrollRepository = new PayrollRepository(app.db);
  const payrollService = new PayrollService(payrollRepository);

  const authenticate = app.authenticate;

  app.get(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listPayrollQuerySchema.parse(request.query);
      const result = await payrollService.listPayrollEntries(request.user.tenantId, query);
      return reply.send(result);
    }
  );

  app.get(
    '/:payrollId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { payrollId } = payrollIdParamSchema.parse(request.params);
      const entry = await payrollService.getPayrollEntryById(payrollId, request.user.tenantId);
      return reply.send(entry);
    }
  );

  app.post(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createPayrollEntrySchema.parse(request.body);
      const entry = await payrollService.createPayrollEntry(request.user.tenantId, body);
      return reply.status(201).send(entry);
    }
  );

  app.patch(
    '/:payrollId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { payrollId } = payrollIdParamSchema.parse(request.params);
      const body = updatePayrollEntrySchema.parse(request.body);
      const entry = await payrollService.updatePayrollEntry(
        payrollId,
        request.user.tenantId,
        body
      );
      return reply.send(entry);
    }
  );

  // Dedicated approve action — semantic clarity over generic PATCH status
  app.post(
    '/:payrollId/approve',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { payrollId } = payrollIdParamSchema.parse(request.params);
      const entry = await payrollService.approvePayrollEntry(
        payrollId,
        request.user.tenantId,
        request.user.userId
      );
      return reply.send(entry);
    }
  );
}
