import { FastifyInstance } from 'fastify';
import { requireTenantRole } from '../../shared/middleware/rbac.middleware.js';
import { sendSuccess, sendNoContent } from '../../shared/utils/response.js';
import { DocumentsRepository } from './documents.repository.js';
import { DocumentsService } from './documents.service.js';
import { createDocumentSchema, updateDocumentSchema, listDocumentsQuerySchema } from './documents.schema.js';

export async function documentsRoutes(app: FastifyInstance): Promise<void> {
  const repo = new DocumentsRepository(app.db);
  const service = new DocumentsService(repo);
  const authenticate = app.authenticate;
  const tenantMemberAccess = requireTenantRole('owner', 'manager', 'employee');
  const tenantAdminAccess = requireTenantRole('owner', 'manager');

  app.get('/', {
    preHandler: [authenticate, tenantMemberAccess],
  }, async (request, reply) => {
    const query = listDocumentsQuerySchema.parse(request.query);
    const result = await service.list(request.user.tenantId, query);
    return sendSuccess(reply, result);
  });

  app.get('/:docId', {
    preHandler: [authenticate, tenantMemberAccess],
  }, async (request, reply) => {
    const { docId } = request.params as { docId: string };
    const result = await service.getById(request.user.tenantId, docId);
    return sendSuccess(reply, result);
  });

  app.post('/', {
    preHandler: [authenticate, tenantMemberAccess],
  }, async (request, reply) => {
    const input = createDocumentSchema.parse(request.body);
    const result = await service.create(request.user.tenantId, request.user.id, input);
    return sendSuccess(reply, result, 201);
  });

  app.patch('/:docId', {
    preHandler: [authenticate, tenantMemberAccess],
  }, async (request, reply) => {
    const { docId } = request.params as { docId: string };
    const input = updateDocumentSchema.parse(request.body);
    const result = await service.update(request.user.tenantId, docId, request.user.id, input);
    return sendSuccess(reply, result);
  });

  app.delete('/:docId', {
    preHandler: [authenticate, tenantAdminAccess],
  }, async (request, reply) => {
    const { docId } = request.params as { docId: string };
    await service.delete(request.user.tenantId, docId);
    return sendNoContent(reply);
  });
}
