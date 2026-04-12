import { Pool } from 'pg';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';

export interface TemplateRecord {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  default_priority: string;
  default_status: string;
  checklist: string[];
  default_labels: string[];
  default_estimate_points: number | null;
  default_estimate_minutes: number | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export class TemplatesRepository {
  constructor(private readonly db: Pool) {}

  async findAll(tenantId: string): Promise<TemplateRecord[]> {
    const result = await this.db.query<TemplateRecord>(
      enforceTenantScope('SELECT * FROM task_templates WHERE tenant_id = $1 ORDER BY name', tenantId),
      [tenantId],
    );
    return result.rows;
  }

  async findById(tenantId: string, templateId: string): Promise<TemplateRecord | null> {
    const result = await this.db.query<TemplateRecord>(
      enforceTenantScope('SELECT * FROM task_templates WHERE id = $1 AND tenant_id = $2', tenantId),
      [templateId, tenantId],
    );
    return result.rows[0] ?? null;
  }

  async create(data: Omit<TemplateRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TemplateRecord> {
    const result = await this.db.query<TemplateRecord>(
      enforceTenantScope(
        `INSERT INTO task_templates (tenant_id, name, description, default_priority, default_status, checklist, default_labels, default_estimate_points, default_estimate_minutes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        data.tenant_id,
      ),
      [data.tenant_id, data.name, data.description, data.default_priority, data.default_status, JSON.stringify(data.checklist), JSON.stringify(data.default_labels), data.default_estimate_points, data.default_estimate_minutes, data.created_by],
    );
    return result.rows[0];
  }

  async update(tenantId: string, templateId: string, data: Partial<Pick<TemplateRecord, 'name' | 'description' | 'default_priority' | 'checklist' | 'default_labels' | 'default_estimate_points' | 'default_estimate_minutes'>>): Promise<TemplateRecord | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (data.name !== undefined) { sets.push(`name = $${idx++}`); params.push(data.name); }
    if (data.description !== undefined) { sets.push(`description = $${idx++}`); params.push(data.description); }
    if (data.default_priority !== undefined) { sets.push(`default_priority = $${idx++}`); params.push(data.default_priority); }
    if (data.checklist !== undefined) { sets.push(`checklist = $${idx++}`); params.push(JSON.stringify(data.checklist)); }
    if (data.default_labels !== undefined) { sets.push(`default_labels = $${idx++}`); params.push(JSON.stringify(data.default_labels)); }
    if (data.default_estimate_points !== undefined) { sets.push(`default_estimate_points = $${idx++}`); params.push(data.default_estimate_points); }
    if (data.default_estimate_minutes !== undefined) { sets.push(`default_estimate_minutes = $${idx++}`); params.push(data.default_estimate_minutes); }
    if (sets.length === 0) return this.findById(tenantId, templateId);
    sets.push('updated_at = NOW()');
    params.push(templateId, tenantId);
    const result = await this.db.query<TemplateRecord>(
      enforceTenantScope(`UPDATE task_templates SET ${sets.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx} RETURNING *`, tenantId),
      params,
    );
    return result.rows[0] ?? null;
  }

  async delete(tenantId: string, templateId: string): Promise<boolean> {
    const result = await this.db.query(
      enforceTenantScope('DELETE FROM task_templates WHERE id = $1 AND tenant_id = $2', tenantId),
      [templateId, tenantId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
