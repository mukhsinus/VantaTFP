import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
} from './users.schema.js';

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  const usersRepository = new UsersRepository(app.db);
  const usersService = new UsersService(usersRepository);

  const authenticate = app.authenticate;

  app.get(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listUsersQuerySchema.parse(request.query);
      const result = await usersService.listUsers(request.user.tenantId!, query.page, query.limit);
      return reply.send(result);
    }
  );

  app.get(
    '/:id',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = userIdParamSchema.parse(request.params);
      const user = await usersService.getUserById(id, request.user.tenantId!);
      return reply.send(user);
    }
  );

  app.post(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createUserSchema.parse(request.body);
      const user = await usersService.createUser(request.user.tenantId!, body, {
        actorUserId: request.user.userId,
        actorRole: request.user.role,
      });
      return reply.status(201).send(user);
    }
  );

  app.patch(
    '/:id',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = userIdParamSchema.parse(request.params);
      const body = updateUserSchema.parse(request.body);
      const user = await usersService.updateUser(id, request.user.tenantId!, body, {
        actorUserId: request.user.userId,
        actorRole: request.user.role,
      });
      return reply.send(user);
    }
  );

  app.delete(
    '/:id',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = userIdParamSchema.parse(request.params);
      await usersService.deactivateUser(id, request.user.tenantId!, {
        actorUserId: request.user.userId,
        actorRole: request.user.role,
      });
      return reply.status(204).send();
    }
  );
}
