import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { NotificationRepository } from '../modules/notifications/notification.repository.js';
import { NotificationService } from '../modules/notifications/notification.service.js';

async function notificationsPlugin(app: FastifyInstance): Promise<void> {
  const repository = new NotificationRepository(app.db);
  const service = new NotificationService(repository);
  app.decorate('notifications', service);
}

export default fastifyPlugin(notificationsPlugin, {
  name: 'notifications',
  dependencies: ['database', 'websocket'],
});
