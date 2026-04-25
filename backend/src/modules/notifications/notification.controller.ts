import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireTenantRole } from '../../shared/middleware/rbac.middleware.js';
import { sendSuccess } from '../../shared/utils/response.js';
import type { AuthenticatedUser } from '../../shared/types/common.types.js';
import { parseJwtTenantIdFromPayload } from '../../shared/auth/jwt-tenant.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { buildAuthenticatedUser } from '../../shared/auth/principal.js';

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = app.authenticate;
  const authRepository = new AuthRepository(app.db);
  const tenantMemberAccess = requireTenantRole('owner', 'manager', 'employee');

  app.get(
    '/unread',
    { preHandler: [authenticate, tenantMemberAccess] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.user.system_role === 'super_admin') {
        return sendSuccess(reply, []);
      }
      const tid = request.user.tenantId;
      if (!tid) {
        return sendSuccess(reply, []);
      }
      const data = await app.notifications.listUnread(tid, request.user.userId);
      return sendSuccess(
        reply,
        data.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          payload: n.payload,
          readAt: n.read_at ? n.read_at.toISOString() : null,
          createdAt: n.created_at.toISOString(),
        }))
      );
    }
  );

  app.get(
    '/ws',
    {
      websocket: true,
    },
    (socket, request) => {
      void (async () => {
        try {
          const protocolHeader = request.headers['sec-websocket-protocol'];
          const rawProtocols = Array.isArray(protocolHeader)
            ? protocolHeader.join(',')
            : String(protocolHeader ?? '');
          const tokenProtocol = rawProtocols
            .split(',')
            .map((v) => v.trim())
            .find((v) => v.startsWith('tfp.jwt.'));
          const token = tokenProtocol?.slice('tfp.jwt.'.length).trim();

          if (!token) {
            app.log.warn({ url: request.url }, 'WS AUTH FAILED: missing protocol token');
            socket?.close(4401, 'Unauthorized');
            return;
          }

          let decoded: AuthenticatedUser;
          try {
            decoded = app.jwt.verify<AuthenticatedUser>(token);
          } catch {
            app.log.warn({ url: request.url }, 'WS AUTH FAILED: invalid token');
            socket?.close(4401, 'Unauthorized');
            return;
          }

          const jwtTenantId = parseJwtTenantIdFromPayload(decoded);
          const authCtx = await authRepository.findAuthContextById(decoded.userId, jwtTenantId);
          if (!authCtx) {
            app.log.warn({ url: request.url }, 'WS AUTH FAILED: unknown user');
            socket?.close(4401, 'Unauthorized');
            return;
          }

          const principal = buildAuthenticatedUser(authCtx, jwtTenantId);
          const tenantId = principal.tenantId;
          const userId = principal.userId;
          if (!tenantId || !userId || principal.system_role === 'super_admin') {
            app.log.warn({ url: request.url }, 'WS AUTH FAILED: invalid tenant context');
            socket?.close(4401, 'Unauthorized');
            return;
          }

          app.log.info({ tenantId, userId }, 'WS CONNECTED');

          try {
            app.notificationHub.connect(tenantId, userId, socket as never);
          } catch (hubErr) {
            app.log.error({ err: hubErr, tenantId, userId }, 'WS hub connect failed');
            try {
              socket?.close(1011, 'Internal error');
            } catch {
              /* ignore */
            }
            return;
          }

          try {
            socket.send(
              JSON.stringify({
                type: 'connected',
                data: { tenantId, userId },
              })
            );
          } catch (sendErr) {
            app.log.warn({ err: sendErr, tenantId, userId }, 'WS initial send failed');
          }

          socket.on('close', () => {
            app.log.info({ tenantId, userId }, 'WS CLOSED');
          });
        } catch (err) {
          app.log.error({ err, url: request.url }, 'WS handler error');
          try {
            socket?.close(4401, 'Unauthorized');
          } catch {
            /* ignore */
          }
        }
      })();
    }
  );
}
