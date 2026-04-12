import { Pool } from 'pg';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';
import { ListCommentsQuery } from './comments.schema.js';

export interface CommentRecord {
  id: string;
  tenant_id: string;
  task_id: string;
  author_id: string;
  parent_comment_id: string | null;
  body: string;
  edited: boolean;
  created_at: Date;
  updated_at: Date;
  author_first_name?: string;
  author_last_name?: string;
  author_email?: string;
}

export class CommentsRepository {
  constructor(private readonly db: Pool) {}

  async findByTask(tenantId: string, taskId: string, query: ListCommentsQuery): Promise<CommentRecord[]> {
    const offset = (query.page - 1) * query.limit;
    const result = await this.db.query<CommentRecord>(
      enforceTenantScope(
        `SELECT c.*, u.first_name as author_first_name, u.last_name as author_last_name, u.email as author_email
         FROM task_comments c
         JOIN users u ON u.id = c.author_id
         WHERE c.tenant_id = $1 AND c.task_id = $2
         ORDER BY c.created_at ASC
         LIMIT $3 OFFSET $4`,
        tenantId,
      ),
      [tenantId, taskId, query.limit, offset],
    );
    return result.rows;
  }

  async countByTask(tenantId: string, taskId: string): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      enforceTenantScope(
        'SELECT COUNT(*) as count FROM task_comments WHERE tenant_id = $1 AND task_id = $2',
        tenantId,
      ),
      [tenantId, taskId],
    );
    return parseInt(result.rows[0].count, 10);
  }

  async findById(tenantId: string, commentId: string): Promise<CommentRecord | null> {
    const result = await this.db.query<CommentRecord>(
      enforceTenantScope('SELECT * FROM task_comments WHERE id = $1 AND tenant_id = $2', tenantId),
      [commentId, tenantId],
    );
    return result.rows[0] ?? null;
  }

  async create(data: { tenant_id: string; task_id: string; author_id: string; body: string; parent_comment_id: string | null }): Promise<CommentRecord> {
    const result = await this.db.query<CommentRecord>(
      enforceTenantScope(
        `INSERT INTO task_comments (tenant_id, task_id, author_id, body, parent_comment_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        data.tenant_id,
      ),
      [data.tenant_id, data.task_id, data.author_id, data.body, data.parent_comment_id],
    );
    return result.rows[0];
  }

  async update(tenantId: string, commentId: string, body: string): Promise<CommentRecord | null> {
    const result = await this.db.query<CommentRecord>(
      enforceTenantScope(
        `UPDATE task_comments SET body = $1, edited = true, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3 RETURNING *`,
        tenantId,
      ),
      [body, commentId, tenantId],
    );
    return result.rows[0] ?? null;
  }

  async delete(tenantId: string, commentId: string): Promise<boolean> {
    const result = await this.db.query(
      enforceTenantScope('DELETE FROM task_comments WHERE id = $1 AND tenant_id = $2', tenantId),
      [commentId, tenantId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
