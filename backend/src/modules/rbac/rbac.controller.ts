import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requirePermission, requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { RbacRepository } from './rbac.repository.js';
import { RbacService } from './rbac.service.js';
import {
  createRoleSchema,
  roleIdParamSchema,
  updateRoleSchema,
} from './rbac.schema.js';

export async function rbacRoutes(app: FastifyInstance): Promise<void> {
  const rbacRepository = new RbacRepository(app.db);
  const rbacService = new RbacService(rbacRepository);
  const authenticate = app.authenticate;

  app.get(
    '/permissions',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const permissions = await rbacService.listPermissions();
      return sendSuccess(reply, permissions);
    }
  );

  app.get(
    '/roles',
    {
      preHandler: [
        authenticate,
        requirePermission('read', 'users'),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const roles = await rbacService.listRoles(request.user.tenantId);
      return sendSuccess(reply, roles);
    }
  );

  app.post(
    '/roles',
    {
      preHandler: [
        authenticate,
        requirePermission('write', 'users'),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createRoleSchema.parse(request.body);
      const role = await rbacService.createRole(request.user.tenantId, body);
      return sendSuccess(reply, role, 201);
    }
  );

  app.patch(
    '/roles/:roleId',
    {
      preHandler: [
        authenticate,
        requirePermission('write', 'users'),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { roleId } = roleIdParamSchema.parse(request.params);
      const body = updateRoleSchema.parse(request.body);
      const role = await rbacService.updateRole(roleId, request.user.tenantId, body);
      return sendSuccess(reply, role);
    }
  );
}
