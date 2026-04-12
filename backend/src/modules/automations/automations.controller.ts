import { FastifyInstance } from 'fastify';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendSuccess, sendNoContent } from '../../shared/utils/response.js';
import { AutomationsRepository } from './automations.repository.js';
import { AutomationsService } from './automations.service.js';
import { createAutomationSchema, updateAutomationSchema, listAutomationsQuerySchema } from './automations.schema.js';

export async function automationsRoutes(app: FastifyInstance): Promise<void> {
  const repo = new AutomationsRepository(app.db);
  const service = new AutomationsService(repo);
  const authenticate = app.authenticate;

  app.get('/', {
    preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')],
  }, async (request, reply) => {
    const query = listAutomationsQuerySchema.parse(request.query);
    const result = await service.list(request.user.tenantId, query);
    return sendSuccess(reply, result);
  });

  app.get('/:ruleId', {
    preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')],
  }, async (request, reply) => {
    const { ruleId } = request.params as { ruleId: string };
    const result = await service.getById(request.user.tenantId, ruleId);
    return sendSuccess(reply, result);
  });

  app.post('/', {
    preHandler: [authenticate, requireRoles('ADMIN')],
  }, async (request, reply) => {
    const input = createAutomationSchema.parse(request.body);
    const result = await service.create(request.user.tenantId, request.user.id, input);
    return sendSuccess(reply, result, 201);
  });

  app.patch('/:ruleId', {
    preHandler: [authenticate, requireRoles('ADMIN')],
  }, async (request, reply) => {
    const { ruleId } = request.params as { ruleId: string };
    const input = updateAutomationSchema.parse(request.body);
    const result = await service.update(request.user.tenantId, ruleId, input);
    return sendSuccess(reply, result);
  });

  app.delete('/:ruleId', {
    preHandler: [authenticate, requireRoles('ADMIN')],
  }, async (request, reply) => {
    const { ruleId } = request.params as { ruleId: string };
    await service.delete(request.user.tenantId, ruleId);
    return sendNoContent(reply);
  });
}
