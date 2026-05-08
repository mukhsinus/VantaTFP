import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ObjectsService } from './objects.service.js';
import { ObjectsRepository } from './objects.repository.js';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendNoContent, sendSuccess } from '../../shared/utils/response.js';
import {
  createObjectInputSchema,
  updateObjectInputSchema,
  listObjectsQuerySchema,
  objectIdParamSchema,
  createObjectTaskInputSchema,
  updateObjectTaskInputSchema,
  listObjectTasksQuerySchema,
  objectTaskIdParamSchema,
  completeObjectTaskInputSchema,
} from './objects.schema.js';

export async function objectsRoutes(app: FastifyInstance): Promise<void> {
  const objectsRepository = new ObjectsRepository(app.db);
  const objectsService = new ObjectsService(objectsRepository);

  const authenticate = app.authenticate;

  function objectsAccess(request: FastifyRequest) {
    return { actingSuperAdmin: request.user.system_role === 'super_admin' };
  }

  // ===== OBJECTS ENDPOINTS =====

  // Create object
  app.post(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.log.info(
        {
          module: 'objects',
          action: 'create',
          user: request.user,
          tenantId: request.user?.tenantId,
        },
        'Creating object'
      );

      const input = createObjectInputSchema.parse(request.body);
      const object = await objectsService.createObject(
        request.user.tenantId,
        request.user.userId,
        input,
        objectsAccess(request)
      );

      return sendSuccess(reply, object, 201);
    }
  );

  // List objects
  app.get(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.log.info(
        {
          module: 'objects',
          action: 'list',
          user: request.user,
          tenantId: request.user?.tenantId,
          query: request.query,
        },
        'Listing objects'
      );

      const query = listObjectsQuerySchema.parse(request.query);
      const result = await objectsService.listObjects(
        request.user.tenantId,
        query,
        objectsAccess(request)
      );

      return sendSuccess(reply, result);
    }
  );

  // Get object by ID
  app.get(
    '/:objectId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { objectId } = objectIdParamSchema.parse(request.params);

      const object = await objectsService.getObject(
        request.user.tenantId,
        objectId,
        objectsAccess(request)
      );

      return sendSuccess(reply, object);
    }
  );

  // Update object
  app.patch(
    '/:objectId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { objectId } = objectIdParamSchema.parse(request.params);
      const input = updateObjectInputSchema.parse(request.body);

      const object = await objectsService.updateObject(
        request.user.tenantId,
        objectId,
        request.user.userId,
        input,
        objectsAccess(request)
      );

      return sendSuccess(reply, object);
    }
  );

  // Delete object
  app.delete(
    '/:objectId',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { objectId } = objectIdParamSchema.parse(request.params);

      await objectsService.deleteObject(
        request.user.tenantId,
        objectId,
        request.user.userId,
        objectsAccess(request)
      );

      return sendNoContent(reply);
    }
  );

  // Get object audit logs
  app.get(
    '/:objectId/audit-logs',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { objectId } = objectIdParamSchema.parse(request.params);

      const logs = await objectsService.getObjectAuditLogs(
        request.user.tenantId,
        objectId,
        objectsAccess(request)
      );

      return sendSuccess(reply, { logs });
    }
  );

  // ===== OBJECT TASKS ENDPOINTS =====

  // Create object task
  app.post(
    '/tasks',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.log.info(
        {
          module: 'objects',
          action: 'create_task',
          user: request.user,
          tenantId: request.user?.tenantId,
        },
        'Creating object task'
      );

      const input = createObjectTaskInputSchema.parse(request.body);
      const task = await objectsService.createObjectTask(
        request.user.tenantId,
        request.user.userId,
        input,
        objectsAccess(request)
      );

      return sendSuccess(reply, task, 201);
    }
  );

  // List object tasks
  app.get(
    '/tasks',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.log.info(
        {
          module: 'objects',
          action: 'list_tasks',
          user: request.user,
          tenantId: request.user?.tenantId,
          query: request.query,
        },
        'Listing object tasks'
      );

      const query = listObjectTasksQuerySchema.parse(request.query);
      const result = await objectsService.listObjectTasks(
        request.user.tenantId,
        query,
        objectsAccess(request)
      );

      return sendSuccess(reply, result);
    }
  );

  // Get object task by ID
  app.get(
    '/tasks/:taskId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = objectTaskIdParamSchema.parse(request.params);

      const task = await objectsService.getObjectTask(
        request.user.tenantId,
        taskId,
        objectsAccess(request)
      );

      return sendSuccess(reply, task);
    }
  );

  // Update object task
  app.patch(
    '/tasks/:taskId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = objectTaskIdParamSchema.parse(request.params);
      const input = updateObjectTaskInputSchema.parse(request.body);

      const task = await objectsService.updateObjectTask(
        request.user.tenantId,
        taskId,
        request.user.userId,
        input,
        objectsAccess(request)
      );

      return sendSuccess(reply, task);
    }
  );

  // Start object task
  app.post(
    '/tasks/:taskId/start',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = objectTaskIdParamSchema.parse(request.params);

      const task = await objectsService.startObjectTask(
        request.user.tenantId,
        taskId,
        request.user.userId,
        objectsAccess(request)
      );

      return sendSuccess(reply, task, 200);
    }
  );

  // Complete object task
  app.post(
    '/tasks/:taskId/complete',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = objectTaskIdParamSchema.parse(request.params);
      const { notes } = completeObjectTaskInputSchema.parse(request.body);

      const task = await objectsService.completeObjectTask(
        request.user.tenantId,
        taskId,
        request.user.userId,
        notes,
        objectsAccess(request)
      );

      return sendSuccess(reply, task, 200);
    }
  );

  // Delete object task
  app.delete(
    '/tasks/:taskId',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = objectTaskIdParamSchema.parse(request.params);

      await objectsService.deleteObjectTask(
        request.user.tenantId,
        taskId,
        request.user.userId,
        objectsAccess(request)
      );

      return sendNoContent(reply);
    }
  );

  // Get object task audit logs
  app.get(
    '/tasks/:taskId/audit-logs',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = objectTaskIdParamSchema.parse(request.params);

      const logs = await objectsService.getObjectAuditLogs(
        request.user.tenantId,
        taskId,
        objectsAccess(request)
      );

      return sendSuccess(reply, { logs });
    }
  );

  // ===== EMPLOYEE ASSIGNMENT ENDPOINTS =====

  // Assign employee to object
  app.post(
    '/:objectId/employees/:userId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { objectId, userId } = objectIdParamSchema.parse(request.params);
      const { role } = request.body as { role?: string };

      const assignment = await objectsService.assignEmployeeToObject(
        request.user.tenantId,
        request.user.userId,
        objectId,
        userId,
        role || 'worker',
        objectsAccess(request)
      );

      return sendSuccess(reply, assignment, 201);
    }
  );

  // Remove employee from object
  app.delete(
    '/:objectId/employees/:userId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { objectId, userId } = objectIdParamSchema.parse(request.params);

      await objectsService.removeEmployeeFromObject(
        request.user.tenantId,
        request.user.userId,
        objectId,
        userId,
        objectsAccess(request)
      );

      return sendNoContent(reply);
    }
  );

  // Get object employees
  app.get(
    '/:objectId/employees',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { objectId } = objectIdParamSchema.parse(request.params);

      const employees = await objectsService.getObjectEmployees(
        request.user.tenantId,
        objectId,
        objectsAccess(request)
      );

      return sendSuccess(reply, { employees });
    }
  );

  // ===== TASK ASSIGNMENT ENDPOINTS =====

  // Assign task to object
  app.post(
    '/:objectId/tasks/:taskId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { objectId, taskId } = request.params as { objectId: string; taskId: string };

      const assignment = await objectsService.assignTaskToObject(
        request.user.tenantId,
        request.user.userId,
        taskId,
        objectId,
        objectsAccess(request)
      );

      return sendSuccess(reply, assignment, 201);
    }
  );

  // Remove task from object
  app.delete(
    '/:objectId/tasks/:taskId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { objectId, taskId } = request.params as { objectId: string; taskId: string };

      await objectsService.removeTaskFromObject(
        request.user.tenantId,
        request.user.userId,
        taskId,
        objectId,
        objectsAccess(request)
      );

      return sendNoContent(reply);
    }
  );

  // Get assigned tasks for object
  app.get(
    '/:objectId/tasks',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { objectId } = objectIdParamSchema.parse(request.params);

      const tasks = await objectsService.getObjectTasks(
        request.user.tenantId,
        objectId,
        objectsAccess(request)
      );

      return sendSuccess(reply, { tasks });
    }
  );

  // Get objects for a task
  app.get(
    '/tasks/:taskId/objects',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = request.params as { taskId: string };

      const objects = await objectsService.getTaskObjects(
        request.user.tenantId,
        taskId,
        objectsAccess(request)
      );

      return sendSuccess(reply, { objects });
    }
  );
}
