import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TenantsService } from './tenants.service.js';
import { TenantsRepository } from './tenants.repository.js';
import {
  requireRole,
  requireSuperAdmin,
} from '../../shared/middleware/rbac.middleware.js';
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
  const superAdminOnly = requireSuperAdmin;
  const canWriteTenants = requireRole('write', 'tenants');

  // Platform-level admin only — list all tenants
  app.get(
    '/',
    { preHandler: [authenticate, superAdminOnly] },
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
    { preHandler: [authenticate, superAdminOnly] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId } = tenantIdParamSchema.parse(request.params);
      const tenant = await tenantsService.getTenantById(tenantId, request.tenantId!);
      return sendSuccess(reply, tenant);
    }
  );

  app.post(
    '/',
    { preHandler: [authenticate, superAdminOnly] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createTenantSchema.parse(request.body);
      const tenant = await tenantsService.createTenant(body);
      return sendSuccess(reply, tenant, 201);
    }
  );

  app.patch(
    '/:tenantId',
    { preHandler: [authenticate, canWriteTenants] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId } = tenantIdParamSchema.parse(request.params);
      const body = updateTenantSchema.parse(request.body);
      const tenant = await tenantsService.updateTenant(tenantId, request.tenantId!, body);
      return sendSuccess(reply, tenant);
    }
  );

  app.delete(
    '/:tenantId',
    { preHandler: [authenticate, superAdminOnly] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId } = tenantIdParamSchema.parse(request.params);
      await tenantsService.deactivateTenant(tenantId, request.tenantId!);
      return sendNoContent(reply);
    }
  );
}
