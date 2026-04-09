import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';
import { EmployeesRepository } from '../employees/employees.repository.js';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendNoContent, sendSuccess, successEnvelope } from '../../shared/utils/response.js';
import { attachIdempotencyKey } from '../../shared/middleware/idempotency.middleware.js';
import { IdempotencyService } from '../../shared/idempotency/idempotency.service.js';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
} from './users.schema.js';

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  const usersRepository = new UsersRepository(app.db);
  const employeesRepository = new EmployeesRepository(app.db);
  const usersService = new UsersService(usersRepository, employeesRepository, app.billing);
  const idempotency = new IdempotencyService(app.db);

  const authenticate = app.authenticate;

  app.get(
    '/me',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const me = await usersService.getMe(request.user);
      return sendSuccess(reply, me);
    }
  );

  app.get(
    '/',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listUsersQuerySchema.parse(request.query);
      const result = await usersService.listUsers(request.user.tenantId, query.page, query.limit);
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/:id',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = userIdParamSchema.parse(request.params);
      const user = await usersService.getUserById(id, request.user.tenantId);
      return sendSuccess(reply, user);
    }
  );

  app.post(
    '/',
    { preHandler: [authenticate, attachIdempotencyKey, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createUserSchema.parse(request.body);
      const idempotent = await idempotency.execute(
        request.user.tenantId,
        request.idempotencyKey,
        async () => {
          const user = await usersService.createUser(request.user.tenantId, body, {
            actorUserId: request.user.userId,
            actorRole: request.user.role,
          });
          return {
            response: successEnvelope(user) as unknown as Record<string, unknown>,
            statusCode: 201,
          };
        }
      );
      return reply.status(idempotent.statusCode).send(idempotent.response);
    }
  );

  app.patch(
    '/:id',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = userIdParamSchema.parse(request.params);
      const body = updateUserSchema.parse(request.body);
      const user = await usersService.updateUser(id, request.user.tenantId, body, {
        actorUserId: request.user.userId,
        actorRole: request.user.role,
      });
      return sendSuccess(reply, user);
    }
  );

  app.delete(
    '/:id',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = userIdParamSchema.parse(request.params);
      await usersService.deactivateUser(id, request.user.tenantId, {
        actorUserId: request.user.userId,
        actorRole: request.user.role,
      });
      return sendNoContent(reply);
    }
  );
}
