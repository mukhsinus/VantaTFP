import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireRoles } from '../../shared/middleware/role-guard.middleware.js';
import { sendSuccess } from '../../shared/utils/response.js';
import type { AuthenticatedUser } from '../../shared/types/common.types.js';

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = app.authenticate;

  app.get(
    '/unread',
    { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE')] },
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

      try {
        const query = (request.query ?? {}) as { token?: string };
        const token = query.token?.trim();
        if (!token) {
          app.log.warn({ url: request.url }, 'WS AUTH FAILED: missing token');
          console.log('WS AUTH FAILED', 'missing token');
          socket?.close(4401, 'Unauthorized');
          return;
        }

        let decoded: AuthenticatedUser;
        try {
          decoded = app.jwt.verify<AuthenticatedUser>(token);
        } catch (err) {
          app.log.warn({ url: request.url }, 'WS AUTH FAILED: invalid token');
          console.log('WS AUTH FAILED', err);
          socket?.close(4401, 'Unauthorized');
          return;
        }

        const tenantId = decoded.tenantId;
        const userId = decoded.userId;
        if (!tenantId || !userId) {
          app.log.warn({ url: request.url }, 'WS AUTH FAILED: token missing tenant/user');
          console.log('WS AUTH FAILED', 'token missing tenant/user');
          socket?.close(4401, 'Unauthorized');
          return;
        }

        console.log('WS CONNECTED', userId);
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

        socket.on('message', (msg: Buffer | string) => {
          try {
            const text = typeof msg === 'string' ? msg : msg.toString();
            console.log('WS MESSAGE', text);
          } catch {
            /* ignore */
          }
        });

        socket.on('close', () => {
          console.log('WS CLOSED');
          app.log.info({ tenantId, userId }, 'WS CLOSED');
        });
      } catch (err) {
        app.log.error({ err, url: request.url }, 'WS handler error');
        console.log('WS AUTH FAILED', err);
        try {
          socket?.close(4401, 'Unauthorized');
        } catch {
          /* ignore */
        }
      }
    }
  );
}
