import { CommentsRepository, CommentRecord } from './comments.repository.js';
import { CreateCommentInput, UpdateCommentInput, ListCommentsQuery } from './comments.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';

export interface CommentResponse {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  parentCommentId: string | null;
  body: string;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

export class CommentsService {
  constructor(private readonly repo: CommentsRepository) {}

  async listByTask(tenantId: string, taskId: string, query: ListCommentsQuery) {
    const [rows, total] = await Promise.all([
      this.repo.findByTask(tenantId, taskId, query),
      this.repo.countByTask(tenantId, taskId),
    ]);
    return {
      data: rows.map((r) => this.toResponse(r)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async create(tenantId: string, taskId: string, userId: string, input: CreateCommentInput): Promise<CommentResponse> {
    const row = await this.repo.create({
      tenant_id: tenantId,
      task_id: taskId,
      author_id: userId,
      body: input.body,
      parent_comment_id: input.parentCommentId ?? null,
    });
    return this.toResponse(row);
  }

  async update(tenantId: string, commentId: string, userId: string, input: UpdateCommentInput): Promise<CommentResponse> {
    const existing = await this.repo.findById(tenantId, commentId);
    if (!existing) throw ApplicationError.notFound('Comment');
    if (existing.author_id !== userId) throw ApplicationError.forbidden('Can only edit own comments');
    const row = await this.repo.update(tenantId, commentId, input.body);
    if (!row) throw ApplicationError.notFound('Comment');
    return this.toResponse(row);
  }

  async delete(tenantId: string, commentId: string, userId: string, userRole: string): Promise<void> {
    const existing = await this.repo.findById(tenantId, commentId);
    if (!existing) throw ApplicationError.notFound('Comment');
    // Authors can delete their own comments; admins/managers can delete any
    if (existing.author_id !== userId && userRole === 'EMPLOYEE') {
      throw ApplicationError.forbidden('Cannot delete other users\' comments');
    }
    await this.repo.delete(tenantId, commentId);
  }

  private toResponse(row: CommentRecord): CommentResponse {
    return {
      id: row.id,
      taskId: row.task_id,
      authorId: row.author_id,
      authorName: [row.author_first_name, row.author_last_name].filter(Boolean).join(' ') || 'Unknown',
      authorEmail: row.author_email ?? '',
      parentCommentId: row.parent_comment_id,
      body: row.body,
      edited: row.edited,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
