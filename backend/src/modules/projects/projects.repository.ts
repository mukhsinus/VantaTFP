import { Pool } from 'pg';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';
import { ListProjectsQuery } from './projects.schema.js';

export interface ProjectRecord {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  sort_order: number;
  archived: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export class ProjectsRepository {
  constructor(private readonly db: Pool) {}

  async findAll(tenantId: string, query: ListProjectsQuery): Promise<ProjectRecord[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let idx = 2;

    if (query.parentId) {
      conditions.push(`parent_id = $${idx++}`);
      params.push(query.parentId);
    } else if (!query.archived) {
      // Top-level by default
      conditions.push('parent_id IS NULL');
    }

    if (query.archived !== undefined) {
      conditions.push(`archived = $${idx++}`);
      params.push(query.archived);
    } else {
      conditions.push('archived = false');
    }

    const offset = (query.page - 1) * query.limit;
    params.push(query.limit, offset);

    const result = await this.db.query<ProjectRecord>(
      enforceTenantScope(
        `SELECT * FROM projects
         WHERE ${conditions.join(' AND ')}
         ORDER BY sort_order, name
         LIMIT $${idx++} OFFSET $${idx}`,
        tenantId,
      ),
      params,
    );
    return result.rows;
  }

  async count(tenantId: string): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      enforceTenantScope('SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1 AND archived = false', tenantId),
      [tenantId],
    );
    return parseInt(result.rows[0].count, 10);
  }

  async findById(tenantId: string, projectId: string): Promise<ProjectRecord | null> {
    const result = await this.db.query<ProjectRecord>(
      enforceTenantScope('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2', tenantId),
      [projectId, tenantId],
    );
    return result.rows[0] ?? null;
  }

  async create(data: Omit<ProjectRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectRecord> {
    const result = await this.db.query<ProjectRecord>(
      enforceTenantScope(
        `INSERT INTO projects (tenant_id, parent_id, name, description, color, icon, sort_order, archived, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        data.tenant_id,
      ),
      [data.tenant_id, data.parent_id, data.name, data.description, data.color, data.icon, data.sort_order, data.archived, data.created_by],
    );
    return result.rows[0];
  }

  async update(tenantId: string, projectId: string, data: Partial<Pick<ProjectRecord, 'name' | 'description' | 'color' | 'icon' | 'archived' | 'sort_order'>>): Promise<ProjectRecord | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { sets.push(`name = $${idx++}`); params.push(data.name); }
    if (data.description !== undefined) { sets.push(`description = $${idx++}`); params.push(data.description); }
    if (data.color !== undefined) { sets.push(`color = $${idx++}`); params.push(data.color); }
    if (data.icon !== undefined) { sets.push(`icon = $${idx++}`); params.push(data.icon); }
    if (data.archived !== undefined) { sets.push(`archived = $${idx++}`); params.push(data.archived); }
    if (data.sort_order !== undefined) { sets.push(`sort_order = $${idx++}`); params.push(data.sort_order); }

    if (sets.length === 0) return this.findById(tenantId, projectId);

    sets.push('updated_at = NOW()');
    params.push(projectId, tenantId);

    const result = await this.db.query<ProjectRecord>(
      enforceTenantScope(
        `UPDATE projects SET ${sets.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx} RETURNING *`,
        tenantId,
      ),
      params,
    );
    return result.rows[0] ?? null;
  }

  async delete(tenantId: string, projectId: string): Promise<boolean> {
    const result = await this.db.query(
      enforceTenantScope('DELETE FROM projects WHERE id = $1 AND tenant_id = $2', tenantId),
      [projectId, tenantId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
