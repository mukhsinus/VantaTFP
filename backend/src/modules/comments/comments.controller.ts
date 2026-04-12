import { FastifyInstance } from 'fastify';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendSuccess, sendNoContent } from '../../shared/utils/response.js';
import { CommentsRepository } from './comments.repository.js';
import { CommentsService } from './comments.service.js';
import { createCommentSchema, updateCommentSchema, listCommentsQuerySchema } from './comments.schema.js';

export async function commentsRoutes(app: FastifyInstance): Promise<void> {
  const repo = new CommentsRepository(app.db);
  const service = new CommentsService(repo);
  const authenticate = app.authenticate;

  // GET /tasks/:taskId/comments
  app.get('/:taskId/comments', {
    preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')],
  }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const query = listCommentsQuerySchema.parse(request.query);
    const result = await service.listByTask(request.user.tenantId, taskId, query);
    return sendSuccess(reply, result);
  });

  // POST /tasks/:taskId/comments
  app.post('/:taskId/comments', {
    preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')],
  }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const input = createCommentSchema.parse(request.body);
    const result = await service.create(request.user.tenantId, taskId, request.user.id, input);
    return sendSuccess(reply, result, 201);
  });

  // PATCH /tasks/:taskId/comments/:commentId
  app.patch('/:taskId/comments/:commentId', {
    preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')],
  }, async (request, reply) => {
    const { commentId } = request.params as { taskId: string; commentId: string };
    const input = updateCommentSchema.parse(request.body);
    const result = await service.update(request.user.tenantId, commentId, request.user.id, input);
    return sendSuccess(reply, result);
  });

  // DELETE /tasks/:taskId/comments/:commentId
  app.delete('/:taskId/comments/:commentId', {
    preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')],
  }, async (request, reply) => {
    const { commentId } = request.params as { taskId: string; commentId: string };
    await service.delete(request.user.tenantId, commentId, request.user.id, request.user.role);
    return sendNoContent(reply);
  });
}
