import { sendEmailStub } from '../../shared/notifications/email.stub.js';
import { sendTelegramStub } from '../../shared/notifications/telegram.stub.js';
import {
  NotificationPayload,
  NotificationRecord,
  NotificationType,
} from './notification.types.js';
import { NotificationRepository } from './notification.repository.js';
import { assertTenantEntityMatch } from '../../shared/utils/tenant-scope.js';

export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  async createAndDispatch(params: {
    tenantId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    payload: NotificationPayload;
  }): Promise<NotificationRecord> {
    const notification = await this.repository.create({
      tenantId: params.tenantId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      payload: params.payload as unknown as Record<string, unknown>,
    });
    assertTenantEntityMatch(notification.tenant_id, params.tenantId, 'Notification');

    // In-app realtime push over websocket.
    paramsPayloadSafe(params.payload);
    await this.dispatchRealtime(notification);

    // External channels (stubs).
    await Promise.allSettled([
      sendTelegramStub({
        tenantId: params.tenantId,
        userId: params.userId,
        title: params.title,
        message: params.message,
      }),
      sendEmailStub({
        tenantId: params.tenantId,
        userId: params.userId,
        subject: params.title,
        body: params.message,
      }),
    ]);

    return notification;
  }

  async listUnread(tenantId: string, userId: string) {
    const rows = await this.repository.listUnread(tenantId, userId);
    rows.forEach((row) => assertTenantEntityMatch(row.tenant_id, tenantId, 'Notification'));
    return rows;
  }

  private async dispatchRealtime(notification: NotificationRecord): Promise<void> {
    const wsHub = (globalThis as any).__tfp_notification_hub__ as
      | {
          broadcastToUser: (
            tenantId: string,
            userId: string,
            message: unknown
          ) => Promise<void> | void;
        }
      | undefined;

    if (!wsHub) return;

    await wsHub.broadcastToUser(notification.tenant_id, notification.user_id, {
      type: 'notification',
      data: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        payload: notification.payload,
        createdAt: notification.created_at.toISOString(),
      },
    });
  }
}

function paramsPayloadSafe(_payload: NotificationPayload): void {
  // Intentionally no-op: keeps a single place to enforce payload shape if needed.
}
