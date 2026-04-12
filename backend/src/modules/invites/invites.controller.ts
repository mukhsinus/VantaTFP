import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../../shared/utils/env.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { requireManagerOrAbove } from '../../shared/middleware/rbac.middleware.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { AuthService } from '../auth/auth.service.js';
import { EmployeesRepository } from '../employees/employees.repository.js';
import { InvitesRepository } from './invites.repository.js';
import { InvitesService } from './invites.service.js';
import { createLinkInviteBodySchema, acceptInviteBodySchema } from './invites.schema.js';

export async function invitesRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = app.authenticate;
  const authRepository = new AuthRepository(app.db);
  const employeesRepository = new EmployeesRepository(app.db);

  const authService = new AuthService(
    authRepository,
    (payload, expiresIn) =>
      app.jwt.sign({ ...payload, tokenType: 'access' } as any, {
        expiresIn: expiresIn ?? env.JWT_EXPIRY,
      }),
    (payload, expiresIn) =>
      app.jwt.sign({ ...payload, tokenType: 'refresh' } as any, {
        expiresIn: expiresIn ?? env.JWT_REFRESH_EXPIRY,
      }),
    (token) => app.jwt.verify(token) as any,
    app.billing,
    employeesRepository
  );

  const invitesRepository = new InvitesRepository(app.db);
  const invitesService = new InvitesService(
    invitesRepository,
    authRepository,
    app.billing,
    employeesRepository,
    authService
  );

  app.post('/accept-invite', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = acceptInviteBodySchema.parse(request.body);
    const session = await invitesService.acceptInvite(body);
    return sendSuccess(reply, session, 201);
  });

  app.post(
    '/',
    { preHandler: [authenticate, requireManagerOrAbove()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.user.tenant_id ?? request.user.tenantId;
      if (!tenantId) {
        throw ApplicationError.forbidden('Tenant context required');
      }
      const body = createLinkInviteBodySchema.parse(request.body ?? {});
      const { token, expiresAt } = await invitesService.createLinkInvite(tenantId, body, {
        system_role: request.user.system_role,
        tenant_role: request.user.tenant_role,
      });

      return sendSuccess(
        reply,
        {
          token,
          tenantId,
          role: body.role,
          expiresAt: expiresAt.toISOString(),
        },
        201
      );
    }
  );
}
