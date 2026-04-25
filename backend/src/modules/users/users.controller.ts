import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';
import { EmployeesRepository } from '../employees/employees.repository.js';
import { requireOwner, requireRole } from '../../shared/middleware/rbac.middleware.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { sendNoContent, sendSuccess, successEnvelope } from '../../shared/utils/response.js';
import { attachIdempotencyKey } from '../../shared/middleware/idempotency.middleware.js';
import { IdempotencyService } from '../../shared/idempotency/idempotency.service.js';
import {
  createUserSchema,
  inviteUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
  updateMyProfileSchema,
  updateMyPasswordSchema,
  updateMyNotificationsSchema,
} from './users.schema.js';

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  const usersRepository = new UsersRepository(app.db);
  const employeesRepository = new EmployeesRepository(app.db);
  const usersService = new UsersService(usersRepository, employeesRepository, app.billing);
  const idempotency = new IdempotencyService(app.db);

  const authenticate = app.authenticate;
  const canReadUsers = requireRole('read', 'users');
  const canWriteUsers = requireRole('write', 'users');

  app.get(
    '/me',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const me = await usersService.getMe(request.user);
      return sendSuccess(reply, me);
    }
  );

  /** Canonical self-service profile update (`PATCH /api/v1/users/profile`). */
  app.patch(
    '/profile',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = updateMyProfileSchema.parse(request.body);
      const me = await usersService.updateMyProfile(request.user, body);
      return sendSuccess(reply, me);
    }
  );

  /** Canonical self-service password update (`PATCH /api/v1/users/password`). */
  app.patch(
    '/password',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = updateMyPasswordSchema.parse(request.body);
      await usersService.updateMyPassword(request.user, body);
      return sendSuccess(reply, { ok: true });
    }
  );

  app.patch(
    '/me/profile',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = updateMyProfileSchema.parse(request.body);
      const me = await usersService.updateMyProfile(request.user, body);
      return sendSuccess(reply, me);
    }
  );

  app.patch(
    '/me/password',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = updateMyPasswordSchema.parse(request.body);
      await usersService.updateMyPassword(request.user, body);
      return sendSuccess(reply, { ok: true });
    }
  );

  app.patch(
    '/me/notifications',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = updateMyNotificationsSchema.parse(request.body);
      const notifications = await usersService.updateMyNotifications(request.user, body);
      return sendSuccess(reply, { notifications });
    }
  );

  app.get(
    '/',
    { preHandler: [authenticate, canReadUsers] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listUsersQuerySchema.parse(request.query);
      const result = await usersService.listUsers(request.user.tenantId, query.page, query.limit);
      return sendSuccess(reply, result);
    }
  );

  app.get(
    '/:id',
    { preHandler: [authenticate, canReadUsers] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = userIdParamSchema.parse(request.params);
      const user = await usersService.getUserById(id, request.user.tenantId);
      return sendSuccess(reply, user);
    }
  );

  app.post(
    '/invite',
    { preHandler: [authenticate, requireOwner()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.user.tenantId;
      if (!tenantId) {
        throw ApplicationError.forbidden('Tenant context required');
      }
      const body = inviteUserSchema.parse(request.body);
      const invited = await usersService.inviteUser(tenantId, body, {
        actorUserId: request.user.userId,
        actorTenantRole: request.user.tenant_role,
        actorSystemRole: request.user.system_role,
      });
      return sendSuccess(reply, invited, 201);
    }
  );

  app.post(
    '/',
    { preHandler: [authenticate, attachIdempotencyKey, canWriteUsers] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createUserSchema.parse(request.body);
      const idempotent = await idempotency.execute(
        request.user.tenantId,
        request.idempotencyKey,
        async () => {
          const user = await usersService.createUser(request.user.tenantId, body, {
            actorUserId: request.user.userId,
            actorTenantRole: request.user.tenant_role,
            actorSystemRole: request.user.system_role,
            bypassSubscriptionChecks: request.user.system_role === 'super_admin',
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
    { preHandler: [authenticate, canWriteUsers] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = userIdParamSchema.parse(request.params);
      const body = updateUserSchema.parse(request.body);
      const user = await usersService.updateUser(id, request.user.tenantId, body, {
        actorUserId: request.user.userId,
        actorTenantRole: request.user.tenant_role,
        actorSystemRole: request.user.system_role,
      });
      return sendSuccess(reply, user);
    }
  );

  app.delete(
    '/:id',
    { preHandler: [authenticate, canWriteUsers] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = userIdParamSchema.parse(request.params);
      await usersService.deactivateUser(id, request.user.tenantId, {
        actorUserId: request.user.userId,
        actorTenantRole: request.user.tenant_role,
        actorSystemRole: request.user.system_role,
      });
      return sendNoContent(reply);
    }
  );
}
