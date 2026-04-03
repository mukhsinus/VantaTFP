import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TenantsService } from './tenants.service.js';
import { TenantsRepository } from './tenants.repository.js';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import {
  createTenantSchema,
  updateTenantSchema,
  tenantIdParamSchema,
} from './tenants.schema.js';

export async function tenantsRoutes(app: FastifyInstance): Promise<void> {
  const tenantsRepository = new TenantsRepository(app.db);
  const tenantsService = new TenantsService(tenantsRepository);

  const authenticate = app.authenticate;

  // Platform-level admin only — list all tenants
  app.get(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const tenants = await tenantsService.getAllTenants();
      return reply.send(tenants);
    }
  );

  app.get(
    '/:tenantId',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId } = tenantIdParamSchema.parse(request.params);
      const tenant = await tenantsService.getTenantById(tenantId);
      return reply.send(tenant);
    }
  );

  app.post(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createTenantSchema.parse(request.body);
      const tenant = await tenantsService.createTenant(body);
      return reply.status(201).send(tenant);
    }
  );

  app.patch(
    '/:tenantId',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId } = tenantIdParamSchema.parse(request.params);
      const body = updateTenantSchema.parse(request.body);
      const tenant = await tenantsService.updateTenant(tenantId, body);
      return reply.send(tenant);
    }
  );

  app.delete(
    '/:tenantId',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId } = tenantIdParamSchema.parse(request.params);
      await tenantsService.deactivateTenant(tenantId);
      return reply.status(204).send();
    }
  );
}
