import fastifyPlugin from 'fastify-plugin';
import fastifyWebsocket from '@fastify/websocket';
import { FastifyInstance } from 'fastify';

type SocketLike = {
  send: (data: string) => void;
  on: (event: 'close', cb: () => void) => void;
};

type NotificationHub = {
  connect: (tenantId: string, userId: string, socket: SocketLike) => void;
  broadcastToUser: (tenantId: string, userId: string, message: unknown) => void;
};

function key(tenantId: string, userId: string): string {
  return `${tenantId}:${userId}`;
}

async function websocketPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyWebsocket);

  const connections = new Map<string, Set<SocketLike>>();

  const hub: NotificationHub = {
    connect(tenantId, userId, socket) {
      const k = key(tenantId, userId);
      const set = connections.get(k) ?? new Set<SocketLike>();
      set.add(socket);
      connections.set(k, set);

      socket.on('close', () => {
        const current = connections.get(k);
        if (!current) return;
        current.delete(socket);
        if (current.size === 0) {
          connections.delete(k);
        }
      });
    },
    broadcastToUser(tenantId, userId, message) {
      const set = connections.get(key(tenantId, userId));
      if (!set || set.size === 0) return;
      const payload = JSON.stringify(message);
      for (const socket of set) {
        try {
          socket.send(payload);
        } catch {
          // ignore one-off socket send errors
        }
      }
    },
  };

  app.decorate('notificationHub', hub);
  (globalThis as any).__tfp_notification_hub__ = hub;
}

export default fastifyPlugin(websocketPlugin, {
  name: 'websocket',
  dependencies: ['jwt'],
});
