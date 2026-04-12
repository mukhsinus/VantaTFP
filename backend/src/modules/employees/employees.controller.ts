import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { EmployeesService } from './employees.service.js';
import { EmployeesRepository } from './employees.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { requireManagerOrAbove, requireOwner } from '../../shared/middleware/rbac.middleware.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { sendNoContent, sendSuccess } from '../../shared/utils/response.js';
import {
  listEmployeesQuerySchema,
  employeeIdParamSchema,
  patchEmployeeRoleBodySchema,
} from './employees.schema.js';

export async function employeesRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = app.authenticate;
  const employeesRepository = new EmployeesRepository(app.db);
  const usersRepository = new UsersRepository(app.db);
  const employeesService = new EmployeesService(employeesRepository, usersRepository);

  app.get(
    '/',
    { preHandler: [authenticate, requireManagerOrAbove()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listEmployeesQuerySchema.parse(request.query);
      const tenantId = request.tenantId;
      if (!tenantId) {
        if (request.user.system_role === 'super_admin') {
          return sendSuccess(reply, {
            data: [],
            pagination: {
              total: 0,
              page: query.page,
              limit: query.limit,
              pages: 1,
              hasMore: false,
            },
          });
        }
        throw ApplicationError.forbidden('Tenant context required');
      }
      const result = await employeesService.listEmployees(tenantId, query);
      return sendSuccess(reply, result);
    }
  );

  app.patch(
    '/:id/role',
    { preHandler: [authenticate, requireOwner()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) {
        throw ApplicationError.forbidden('Tenant context required');
      }
      const { id } = employeeIdParamSchema.parse(request.params);
      const body = patchEmployeeRoleBodySchema.parse(request.body);
      const updated = await employeesService.patchEmployeeRole(tenantId, id, body, request.user.id);
      return sendSuccess(reply, updated);
    }
  );

  app.delete(
    '/:id',
    { preHandler: [authenticate, requireManagerOrAbove()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;
      if (!tenantId) {
        throw ApplicationError.forbidden('Tenant context required');
      }
      const { id } = employeeIdParamSchema.parse(request.params);
      await employeesService.deactivateEmployee(tenantId, id, request.user.id, request.user.role);
      return sendNoContent(reply);
    }
  );
}
