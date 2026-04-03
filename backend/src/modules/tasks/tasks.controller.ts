import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TasksService } from './tasks.service.js';
import { TasksRepository } from './tasks.repository.js';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
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
      const query = listTasksQuerySchema.parse(request.query);
      const result = await tasksService.listTasks(request.user.tenantId, query);
      return reply.send(result);
    }
  );

  app.get(
    '/:taskId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = taskIdParamSchema.parse(request.params);
      const task = await tasksService.getTaskById(taskId, request.user.tenantId);
      return reply.send(task);
    }
  );

  app.post(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createTaskSchema.parse(request.body);
      const task = await tasksService.createTask(
        request.user.tenantId,
        request.user.userId,
        body
      );
      return reply.status(201).send(task);
    }
  );

  app.patch(
    '/:taskId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = taskIdParamSchema.parse(request.params);
      const body = updateTaskSchema.parse(request.body);
      const task = await tasksService.updateTask(taskId, request.user.tenantId, body);
      return reply.send(task);
    }
  );

  app.delete(
    '/:taskId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = taskIdParamSchema.parse(request.params);
      await tasksService.deleteTask(taskId, request.user.tenantId);
      return reply.status(204).send();
    }
  );
}
