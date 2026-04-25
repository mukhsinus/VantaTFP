import { FastifyInstance } from 'fastify';
import { requireTenantRole } from '../../shared/middleware/rbac.middleware.js';
import { sendSuccess, sendNoContent } from '../../shared/utils/response.js';
import { TemplatesRepository } from './templates.repository.js';
import { TemplatesService } from './templates.service.js';
import { createTemplateSchema, updateTemplateSchema } from './templates.schema.js';

export async function templatesRoutes(app: FastifyInstance): Promise<void> {
  const repo = new TemplatesRepository(app.db);
  const service = new TemplatesService(repo);
  const authenticate = app.authenticate;
  const tenantMemberAccess = requireTenantRole('owner', 'manager', 'employee');
  const tenantAdminAccess = requireTenantRole('owner', 'manager');

  app.get('/', {
    preHandler: [authenticate, tenantMemberAccess],
  }, async (request, reply) => {
    const result = await service.list(request.user.tenantId);
    return sendSuccess(reply, result);
  });

  app.get('/:templateId', {
    preHandler: [authenticate, tenantMemberAccess],
  }, async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    const result = await service.getById(request.user.tenantId, templateId);
    return sendSuccess(reply, result);
  });

  app.post('/', {
    preHandler: [authenticate, tenantAdminAccess],
  }, async (request, reply) => {
    const input = createTemplateSchema.parse(request.body);
    const result = await service.create(request.user.tenantId, request.user.id, input);
    return sendSuccess(reply, result, 201);
  });

  app.patch('/:templateId', {
    preHandler: [authenticate, tenantAdminAccess],
  }, async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    const input = updateTemplateSchema.parse(request.body);
    const result = await service.update(request.user.tenantId, templateId, input);
    return sendSuccess(reply, result);
  });

  app.delete('/:templateId', {
    preHandler: [authenticate, tenantAdminAccess],
  }, async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    await service.delete(request.user.tenantId, templateId);
    return sendNoContent(reply);
  });
}
