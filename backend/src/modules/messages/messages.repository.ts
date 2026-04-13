import type { Pool } from 'pg';

export interface ConversationRow {
  id: string;
  tenant_id: string;
  name: string | null;
  type: 'direct' | 'group';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  tenant_id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export class MessagesRepository {
  constructor(private readonly db: Pool) {}

  async createConversation(data: {
    tenantId: string;
    createdBy: string;
    name?: string;
    type: 'direct' | 'group';
    memberIds: string[];
  }): Promise<ConversationRow> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const convResult = await client.query<ConversationRow>(
        `
        INSERT INTO conversations (tenant_id, name, type, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
        `,
        [data.tenantId, data.name ?? null, data.type, data.createdBy]
      );
      const conv = convResult.rows[0];

      const allMemberIds = [...new Set([data.createdBy, ...data.memberIds])];
      for (const memberId of allMemberIds) {
        await client.query(
          `
          INSERT INTO conversation_members (conversation_id, user_id, tenant_id, joined_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (conversation_id, user_id) DO NOTHING
          `,
          [conv.id, memberId, data.tenantId]
        );
      }

      await client.query('COMMIT');
      return conv;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listConversationsForUser(tenantId: string, userId: string): Promise<ConversationRow[]> {
    const result = await this.db.query<ConversationRow>(
      `
      SELECT c.*
      FROM conversations c
      JOIN conversation_members cm ON cm.conversation_id = c.id
      WHERE cm.user_id = $1 AND c.tenant_id = $2
      ORDER BY c.updated_at DESC
      `,
      [userId, tenantId]
    );
    return result.rows;
  }

  async isMember(conversationId: string, userId: string): Promise<boolean> {
    const result = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS(
        SELECT 1 FROM conversation_members
        WHERE conversation_id = $1 AND user_id = $2
      ) AS exists`,
      [conversationId, userId]
    );
    return result.rows[0]?.exists ?? false;
  }

  async sendMessage(data: {
    tenantId: string;
    conversationId: string;
    senderId: string;
    body?: string;
    attachmentUrl?: string;
    attachmentName?: string;
  }): Promise<MessageRow> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const msgResult = await client.query<MessageRow>(
        `
        INSERT INTO messages (tenant_id, conversation_id, sender_id, body, attachment_url, attachment_name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
        `,
        [
          data.tenantId,
          data.conversationId,
          data.senderId,
          data.body ?? null,
          data.attachmentUrl ?? null,
          data.attachmentName ?? null,
        ]
      );

      await client.query(
        `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
        [data.conversationId]
      );

      await client.query('COMMIT');
      return msgResult.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listMessages(
    conversationId: string,
    limit: number,
    before?: string
  ): Promise<MessageRow[]> {
    const sql = before
      ? `
        SELECT * FROM messages
        WHERE conversation_id = $1 AND is_deleted = FALSE AND created_at < $3
        ORDER BY created_at DESC
        LIMIT $2
        `
      : `
        SELECT * FROM messages
        WHERE conversation_id = $1 AND is_deleted = FALSE
        ORDER BY created_at DESC
        LIMIT $2
        `;
    const params = before ? [conversationId, limit, before] : [conversationId, limit];
    const result = await this.db.query<MessageRow>(sql, params);
    return result.rows.reverse();
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    await this.db.query(
      `
      UPDATE conversation_members
      SET last_read_at = NOW()
      WHERE conversation_id = $1 AND user_id = $2
      `,
      [conversationId, userId]
    );
  }

  async deleteMessage(id: string, senderId: string): Promise<void> {
    await this.db.query(
      `UPDATE messages SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND sender_id = $2`,
      [id, senderId]
    );
  }
}
