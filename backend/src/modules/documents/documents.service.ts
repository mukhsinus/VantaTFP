import { DocumentsRepository, DocumentRecord } from './documents.repository.js';
import { CreateDocumentInput, UpdateDocumentInput, ListDocumentsQuery } from './documents.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';

export interface DocumentResponse {
  id: string;
  projectId: string | null;
  parentId: string | null;
  title: string;
  content: string;
  contentType: string;
  icon: string;
  coverUrl: string | null;
  isTemplate: boolean;
  archived: boolean;
  sortOrder: number;
  createdBy: string;
  lastEditedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export class DocumentsService {
  constructor(private readonly repo: DocumentsRepository) {}

  async list(tenantId: string, query: ListDocumentsQuery) {
    const [rows, total] = await Promise.all([
      this.repo.findAll(tenantId, query),
      this.repo.count(tenantId),
    ]);
    return {
      data: rows.map((r) => this.toResponse(r)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async getById(tenantId: string, docId: string): Promise<DocumentResponse> {
    const row = await this.repo.findById(tenantId, docId);
    if (!row) throw ApplicationError.notFound('Document');
    return this.toResponse(row);
  }

  async create(tenantId: string, userId: string, input: CreateDocumentInput): Promise<DocumentResponse> {
    const row = await this.repo.create({
      tenant_id: tenantId,
      project_id: input.projectId ?? null,
      parent_id: input.parentId ?? null,
      title: input.title,
      content: input.content,
      content_type: input.contentType,
      icon: input.icon ?? '📄',
      cover_url: null,
      is_template: input.isTemplate,
      archived: false,
      sort_order: 0,
      created_by: userId,
    });
    return this.toResponse(row);
  }

  async update(tenantId: string, docId: string, userId: string, input: UpdateDocumentInput): Promise<DocumentResponse> {
    const row = await this.repo.update(tenantId, docId, userId, {
      title: input.title,
      content: input.content,
      icon: input.icon,
      cover_url: input.coverUrl,
      archived: input.archived,
      sort_order: input.sortOrder,
    });
    if (!row) throw ApplicationError.notFound('Document');
    return this.toResponse(row);
  }

  async delete(tenantId: string, docId: string): Promise<void> {
    const ok = await this.repo.delete(tenantId, docId);
    if (!ok) throw ApplicationError.notFound('Document');
  }

  private toResponse(row: DocumentRecord): DocumentResponse {
    return {
      id: row.id,
      projectId: row.project_id,
      parentId: row.parent_id,
      title: row.title,
      content: row.content,
      contentType: row.content_type,
      icon: row.icon,
      coverUrl: row.cover_url,
      isTemplate: row.is_template,
      archived: row.archived,
      sortOrder: row.sort_order,
      createdBy: row.created_by,
      lastEditedBy: row.last_edited_by,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
