import { FastifyInstance } from 'fastify';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendSuccess, sendNoContent } from '../../shared/utils/response.js';
import { ProjectsRepository } from './projects.repository.js';
import { ProjectsService } from './projects.service.js';
import { createProjectSchema, updateProjectSchema, listProjectsQuerySchema } from './projects.schema.js';

export async function projectsRoutes(app: FastifyInstance): Promise<void> {
  const repo = new ProjectsRepository(app.db);
  const service = new ProjectsService(repo);
  const authenticate = app.authenticate;

  app.get('/', {
    preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')],
  }, async (request, reply) => {
    const query = listProjectsQuerySchema.parse(request.query);
    const result = await service.list(request.user.tenantId, query);
    return sendSuccess(reply, result);
  });

  app.get('/:projectId', {
    preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')],
  }, async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const result = await service.getById(request.user.tenantId, projectId);
    return sendSuccess(reply, result);
  });

  app.post('/', {
    preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')],
  }, async (request, reply) => {
    const input = createProjectSchema.parse(request.body);
    const result = await service.create(request.user.tenantId, request.user.id, input);
    return sendSuccess(reply, result, 201);
  });

  app.patch('/:projectId', {
    preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')],
  }, async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const input = updateProjectSchema.parse(request.body);
    const result = await service.update(request.user.tenantId, projectId, input);
    return sendSuccess(reply, result);
  });

  app.delete('/:projectId', {
    preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')],
  }, async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    await service.delete(request.user.tenantId, projectId);
    return sendNoContent(reply);
  });
}
