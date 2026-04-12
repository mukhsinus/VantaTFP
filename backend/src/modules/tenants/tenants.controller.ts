import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TenantsService } from './tenants.service.js';
import { TenantsRepository } from './tenants.repository.js';
import { requireRoles, requireTenantMemberRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendNoContent, sendSuccess } from '../../shared/utils/response.js';
import {
  createTenantSchema,
  updateTenantSchema,
  tenantIdParamSchema,
  listTenantsQuerySchema,
} from './tenants.schema.js';

export async function tenantsRoutes(app: FastifyInstance): Promise<void> {
  const tenantsRepository = new TenantsRepository(app.db);
  const tenantsService = new TenantsService(tenantsRepository, app.billing);

  const authenticate = app.authenticate;

  // Platform-level admin only — list all tenants
  app.get(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listTenantsQuerySchema.parse(request.query);
      const result = await tenantsService.listCurrentTenant(
        request.user.tenantId,
        query.page,
        query.limit
      );
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/:tenantId',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId } = tenantIdParamSchema.parse(request.params);
      const tenant = await tenantsService.getTenantById(tenantId, request.tenantId!);
      return sendSuccess(reply, tenant);
    }
  );

  app.post(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createTenantSchema.parse(request.body);
      const tenant = await tenantsService.createTenant(body);
      return sendSuccess(reply, tenant, 201);
    }
  );

  app.patch(
    '/:tenantId',
    { preHandler: [authenticate, requireTenantMemberRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId } = tenantIdParamSchema.parse(request.params);
      console.log('req.body', request.body);
      const body = updateTenantSchema.parse(request.body);
      const tenant = await tenantsService.updateTenant(tenantId, request.tenantId!, body);
      return sendSuccess(reply, tenant);
    }
  );

  app.delete(
    '/:tenantId',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId } = tenantIdParamSchema.parse(request.params);
      await tenantsService.deactivateTenant(tenantId, request.tenantId!);
      return sendNoContent(reply);
    }
  );
}
