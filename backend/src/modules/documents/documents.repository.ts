import { Pool } from 'pg';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';
import { ListDocumentsQuery } from './documents.schema.js';

export interface DocumentRecord {
  id: string;
  tenant_id: string;
  project_id: string | null;
  parent_id: string | null;
  title: string;
  content: string;
  content_type: string;
  icon: string;
  cover_url: string | null;
  is_template: boolean;
  archived: boolean;
  sort_order: number;
  created_by: string;
  last_edited_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export class DocumentsRepository {
  constructor(private readonly db: Pool) {}

  async findAll(tenantId: string, query: ListDocumentsQuery): Promise<DocumentRecord[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let idx = 2;

    if (query.projectId) { conditions.push(`project_id = $${idx++}`); params.push(query.projectId); }
    if (query.parentId) { conditions.push(`parent_id = $${idx++}`); params.push(query.parentId); }
    else if (!query.archived && !query.isTemplate) { conditions.push('parent_id IS NULL'); }
    if (query.archived !== undefined) { conditions.push(`archived = $${idx++}`); params.push(query.archived); }
    else { conditions.push('archived = false'); }
    if (query.isTemplate !== undefined) { conditions.push(`is_template = $${idx++}`); params.push(query.isTemplate); }

    const offset = (query.page - 1) * query.limit;
    params.push(query.limit, offset);

    const result = await this.db.query<DocumentRecord>(
      enforceTenantScope(
        `SELECT * FROM documents WHERE ${conditions.join(' AND ')} ORDER BY sort_order, title LIMIT $${idx++} OFFSET $${idx}`,
        tenantId,
      ),
      params,
    );
    return result.rows;
  }

  async count(tenantId: string): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      enforceTenantScope('SELECT COUNT(*) as count FROM documents WHERE tenant_id = $1 AND archived = false', tenantId),
      [tenantId],
    );
    return parseInt(result.rows[0].count, 10);
  }

  async findById(tenantId: string, docId: string): Promise<DocumentRecord | null> {
    const result = await this.db.query<DocumentRecord>(
      enforceTenantScope('SELECT * FROM documents WHERE id = $1 AND tenant_id = $2', tenantId),
      [docId, tenantId],
    );
    return result.rows[0] ?? null;
  }

  async create(data: Omit<DocumentRecord, 'id' | 'created_at' | 'updated_at' | 'last_edited_by'>): Promise<DocumentRecord> {
    const result = await this.db.query<DocumentRecord>(
      enforceTenantScope(
        `INSERT INTO documents (tenant_id, project_id, parent_id, title, content, content_type, icon, is_template, archived, sort_order, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        data.tenant_id,
      ),
      [data.tenant_id, data.project_id, data.parent_id, data.title, data.content, data.content_type, data.icon, data.is_template, data.archived, data.sort_order, data.created_by],
    );
    return result.rows[0];
  }

  async update(tenantId: string, docId: string, userId: string, data: Partial<Pick<DocumentRecord, 'title' | 'content' | 'icon' | 'cover_url' | 'archived' | 'sort_order'>>): Promise<DocumentRecord | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.title !== undefined) { sets.push(`title = $${idx++}`); params.push(data.title); }
    if (data.content !== undefined) { sets.push(`content = $${idx++}`); params.push(data.content); }
    if (data.icon !== undefined) { sets.push(`icon = $${idx++}`); params.push(data.icon); }
    if (data.cover_url !== undefined) { sets.push(`cover_url = $${idx++}`); params.push(data.cover_url); }
    if (data.archived !== undefined) { sets.push(`archived = $${idx++}`); params.push(data.archived); }
    if (data.sort_order !== undefined) { sets.push(`sort_order = $${idx++}`); params.push(data.sort_order); }

    if (sets.length === 0) return this.findById(tenantId, docId);

    sets.push(`last_edited_by = $${idx++}`, 'updated_at = NOW()');
    params.push(userId, docId, tenantId);

    const result = await this.db.query<DocumentRecord>(
      enforceTenantScope(
        `UPDATE documents SET ${sets.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx} RETURNING *`,
        tenantId,
      ),
      params,
    );
    return result.rows[0] ?? null;
  }

  async delete(tenantId: string, docId: string): Promise<boolean> {
    const result = await this.db.query(
      enforceTenantScope('DELETE FROM documents WHERE id = $1 AND tenant_id = $2', tenantId),
      [docId, tenantId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
