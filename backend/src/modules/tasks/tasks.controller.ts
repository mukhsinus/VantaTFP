import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TasksService } from './tasks.service.js';
import { TasksRepository } from './tasks.repository.js';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendNoContent, sendSuccess } from '../../shared/utils/response.js';
import {
  createTaskInputSchema,
  updateTaskInputSchema,
  taskIdParamSchema,
  listTasksQuerySchema,
} from './tasks.schema.js';

export async function tasksRoutes(app: FastifyInstance): Promise<void> {
  const tasksRepository = new TasksRepository(app.db);
  const tasksService = new TasksService(tasksRepository);

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
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createTaskInputSchema.parse(request.body);
      const task = await tasksService.createTask(
        request.user.tenantId,
        request.user.userId,
        body
      );
      return sendSuccess(reply, task, 201);
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
