import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireSystemRole } from '../../shared/middleware/rbac.middleware.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { PlatformRepository } from './platform.repository.js';
import { PlatformService } from './platform.service.js';
import { platformListQuerySchema } from './platform.schema.js';

export async function platformRoutes(app: FastifyInstance): Promise<void> {
  const service = new PlatformService(new PlatformRepository(app.db));
  const authenticate = app.authenticate;
  const superOnly = [authenticate, requireSystemRole('super_admin')];

  app.get(
    '/tenants',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const q = platformListQuerySchema.parse(request.query);
      const result = await service.listTenants(q.page, q.limit);
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/users',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const q = platformListQuerySchema.parse(request.query);
      const result = await service.listUsers(q.page, q.limit);
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/subscriptions',
    { preHandler: superOnly },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const q = platformListQuerySchema.parse(request.query);
      const result = await service.listSubscriptions(q.page, q.limit);
      return sendSuccess(reply, result);
    }
  );
}
