import { FastifyInstance } from 'fastify';
import { requireTenantRole } from '../../shared/middleware/rbac.middleware.js';
import { sendSuccess, sendNoContent } from '../../shared/utils/response.js';
import { LabelsRepository } from './labels.repository.js';
import { LabelsService } from './labels.service.js';
import { createLabelSchema, updateLabelSchema, assignLabelsSchema } from './labels.schema.js';

export async function labelsRoutes(app: FastifyInstance): Promise<void> {
  const repo = new LabelsRepository(app.db);
  const service = new LabelsService(repo);
  const authenticate = app.authenticate;
  const tenantMemberAccess = requireTenantRole('owner', 'manager', 'employee');
  const tenantAdminAccess = requireTenantRole('owner', 'manager');

  // GET /labels — all tenant labels
  app.get('/', {
    preHandler: [authenticate, tenantMemberAccess],
  }, async (request, reply) => {
    const result = await service.list(request.user.tenantId);
    return sendSuccess(reply, result);
  });

  // POST /labels
  app.post('/', {
    preHandler: [authenticate, tenantAdminAccess],
  }, async (request, reply) => {
    const input = createLabelSchema.parse(request.body);
    const result = await service.create(request.user.tenantId, input);
    return sendSuccess(reply, result, 201);
  });

  // PATCH /labels/:labelId
  app.patch('/:labelId', {
    preHandler: [authenticate, tenantAdminAccess],
  }, async (request, reply) => {
    const { labelId } = request.params as { labelId: string };
    const input = updateLabelSchema.parse(request.body);
    const result = await service.update(request.user.tenantId, labelId, input);
    return sendSuccess(reply, result);
  });

  // DELETE /labels/:labelId
  app.delete('/:labelId', {
    preHandler: [authenticate, tenantAdminAccess],
  }, async (request, reply) => {
    const { labelId } = request.params as { labelId: string };
    await service.delete(request.user.tenantId, labelId);
    return sendNoContent(reply);
  });

  // GET /labels/task/:taskId — labels on a task
  app.get('/task/:taskId', {
    preHandler: [authenticate, tenantMemberAccess],
  }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const result = await service.getTaskLabels(request.user.tenantId, taskId);
    return sendSuccess(reply, result);
  });

  // PUT /labels/task/:taskId — set labels on a task
  app.put('/task/:taskId', {
    preHandler: [authenticate, tenantAdminAccess],
  }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const { labelIds } = assignLabelsSchema.parse(request.body);
    const result = await service.setTaskLabels(request.user.tenantId, taskId, labelIds);
    return sendSuccess(reply, result);
  });
}
