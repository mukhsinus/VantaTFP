import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from './users.schema.js';

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  const usersRepository = new UsersRepository(app.db);
  const usersService = new UsersService(usersRepository);

  const authenticate = app.authenticate;

  app.get(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const users = await usersService.getAllUsers(request.user.tenantId);
      return reply.send(users);
    }
  );

  app.get(
    '/:userId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = userIdParamSchema.parse(request.params);
      const user = await usersService.getUserById(userId, request.user.tenantId);
      return reply.send(user);
    }
  );

  app.post(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createUserSchema.parse(request.body);
      const user = await usersService.createUser(request.user.tenantId, body);
      return reply.status(201).send(user);
    }
  );

  app.patch(
    '/:userId',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = userIdParamSchema.parse(request.params);
      const body = updateUserSchema.parse(request.body);
      const user = await usersService.updateUser(userId, request.user.tenantId, body);
      return reply.send(user);
    }
  );

  app.delete(
    '/:userId',
    { preHandler: [authenticate, requireRoles('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = userIdParamSchema.parse(request.params);
      await usersService.deactivateUser(userId, request.user.tenantId);
      return reply.status(204).send();
    }
  );
}
