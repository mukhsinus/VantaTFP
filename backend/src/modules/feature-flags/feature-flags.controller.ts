import { FastifyInstance } from 'fastify';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { FeatureFlagsRepository } from './feature-flags.repository.js';
import { FeatureFlagsService } from './feature-flags.service.js';
import { updateFeatureFlagSchema, bulkUpdateFeatureFlagsSchema } from './feature-flags.schema.js';

export async function featureFlagsRoutes(app: FastifyInstance): Promise<void> {
  const repo = new FeatureFlagsRepository(app.db);
  const service = new FeatureFlagsService(repo);
  const authenticate = app.authenticate;

  // GET /feature-flags — all flags for current tenant
  app.get('/', {
    preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')],
  }, async (request, reply) => {
    const flags = await service.getAll(request.user.tenantId);
    return sendSuccess(reply, flags);
  });

  // PATCH /feature-flags — update single flag (ADMIN only)
  app.patch('/', {
    preHandler: [authenticate, requireRoles('ADMIN')],
  }, async (request, reply) => {
    const input = updateFeatureFlagSchema.parse(request.body);
    const result = await service.update(request.user.tenantId, input.featureKey, input.enabled);
    return sendSuccess(reply, result);
  });

  // PUT /feature-flags/bulk — bulk update (ADMIN only)
  app.put('/bulk', {
    preHandler: [authenticate, requireRoles('ADMIN')],
  }, async (request, reply) => {
    const input = bulkUpdateFeatureFlagsSchema.parse(request.body);
    const result = await service.bulkUpdate(request.user.tenantId, input.flags);
    return sendSuccess(reply, result);
  });
}
