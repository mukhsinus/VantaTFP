import { Pool } from 'pg';
import { NotificationRecord, NotificationType } from './notification.types.js';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';

export class NotificationRepository {
  constructor(private readonly db: Pool) {}

  private scoped(sql: string, tenantId: string): string {
    return enforceTenantScope(sql, tenantId);
  }

  async create(params: {
    tenantId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    payload: Record<string, unknown>;
  }): Promise<NotificationRecord> {
    const result = await this.db.query<NotificationRecord>(
      this.scoped(
        `
      INSERT INTO notifications (
        tenant_id,
        user_id,
        type,
        title,
        message,
        payload,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
      RETURNING
        id,
        tenant_id,
        user_id,
        type,
        title,
        message,
        payload,
        read_at,
        created_at
      `,
        params.tenantId
      ),
      [
        params.tenantId,
        params.userId,
        params.type,
        params.title,
        params.message,
        JSON.stringify(params.payload ?? {}),
      ]
    );
    return result.rows[0];
  }

  async listUnread(tenantId: string, userId: string): Promise<NotificationRecord[]> {
    const result = await this.db.query<NotificationRecord>(
      this.scoped(
        `
      SELECT
        id,
        tenant_id,
        user_id,
        type,
        title,
        message,
        payload,
        read_at,
        created_at
      FROM notifications
      WHERE tenant_id = $1
        AND user_id = $2
        AND read_at IS NULL
      ORDER BY created_at DESC
      `,
        tenantId
      ),
      [tenantId, userId]
    );
    return result.rows;
  }
}
