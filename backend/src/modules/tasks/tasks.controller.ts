import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TasksService } from './tasks.service.js';
import { TasksRepository } from './tasks.repository.js';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendNoContent, sendSuccess, successEnvelope } from '../../shared/utils/response.js';
import { attachIdempotencyKey } from '../../shared/middleware/idempotency.middleware.js';
import { IdempotencyService } from '../../shared/idempotency/idempotency.service.js';
import {
  createTaskInputSchema,
  updateTaskInputSchema,
  taskIdParamSchema,
  listTasksQuerySchema,
} from './tasks.schema.js';

export async function tasksRoutes(app: FastifyInstance): Promise<void> {
  const tasksRepository = new TasksRepository(app.db);
  const tasksService = new TasksService(tasksRepository, app.billing);
  const idempotency = new IdempotencyService(app.db);

  const authenticate = app.authenticate;

  app.get(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.log.info(
        {
          module: 'tasks',
          action: 'list',
          user: request.user,
          tenantId: request.user?.tenantId,
          query: request.query,
        },
        'Incoming tasks list request'
      );
      const query = listTasksQuerySchema.parse(request.query);
      const result = await tasksService.listTasks(request.user.tenantId, query);
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/:taskId/history',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = taskIdParamSchema.parse(request.params);
      const history = await tasksService.getUnifiedTaskHistory(
        taskId,
        request.user.tenantId
      );
      return sendSuccess(reply, history);
    }
  );

  app.post(
    '/:taskId/timer/start',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = taskIdParamSchema.parse(request.params);
      const timer = await tasksService.startTaskTimer(
        taskId,
        request.user.tenantId,
        request.user.userId
      );
      return sendSuccess(reply, timer, 201);
    }
  );

  app.post(
    '/:taskId/timer/stop',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = taskIdParamSchema.parse(request.params);
      const timer = await tasksService.stopTaskTimer(
        taskId,
        request.user.tenantId,
        request.user.userId
      );
      return sendSuccess(reply, timer);
    }
  );

  app.get(
    '/:taskId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = taskIdParamSchema.parse(request.params);
      const task = await tasksService.getTaskById(taskId, request.user.tenantId);
      return sendSuccess(reply, task);
    }
  );

  app.post(
    '/',
    { preHandler: [authenticate, attachIdempotencyKey, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createTaskInputSchema.parse(request.body);
      const idempotent = await idempotency.execute(
        request.user.tenantId,
        request.idempotencyKey,
        async () => {
          const task = await tasksService.createTask(
            request.user.tenantId,
            request.user.userId,
            body,
            {
              bypassSubscriptionLimits: request.user.system_role === 'super_admin',
            }
          );
          return {
            response: successEnvelope(task) as unknown as Record<string, unknown>,
            statusCode: 201,
          };
        }
      );
      return reply.status(idempotent.statusCode).send(idempotent.response);
    }
  );

  app.patch(
    '/:taskId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = taskIdParamSchema.parse(request.params);
      const body = updateTaskInputSchema.parse(request.body);
      const task = await tasksService.updateTask(
        taskId,
        request.user.tenantId,
        request.user.userId,
        body
      );
      return sendSuccess(reply, task);
    }
  );

  app.delete(
    '/:taskId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = taskIdParamSchema.parse(request.params);
      await tasksService.deleteTask(taskId, request.user.tenantId, request.user.userId);
      return sendNoContent(reply);
    }
  );
}
