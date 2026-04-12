import { Pool } from 'pg';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';

export interface LabelRecord {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  created_at: Date;
}

export class LabelsRepository {
  constructor(private readonly db: Pool) {}

  async findAll(tenantId: string): Promise<LabelRecord[]> {
    const result = await this.db.query<LabelRecord>(
      enforceTenantScope('SELECT * FROM labels WHERE tenant_id = $1 ORDER BY name', tenantId),
      [tenantId],
    );
    return result.rows;
  }

  async findById(tenantId: string, labelId: string): Promise<LabelRecord | null> {
    const result = await this.db.query<LabelRecord>(
      enforceTenantScope('SELECT * FROM labels WHERE id = $1 AND tenant_id = $2', tenantId),
      [labelId, tenantId],
    );
    return result.rows[0] ?? null;
  }

  async create(tenantId: string, name: string, color: string): Promise<LabelRecord> {
    const result = await this.db.query<LabelRecord>(
      enforceTenantScope(
        'INSERT INTO labels (tenant_id, name, color) VALUES ($1, $2, $3) RETURNING *',
        tenantId,
      ),
      [tenantId, name, color],
    );
    return result.rows[0];
  }

  async update(tenantId: string, labelId: string, data: { name?: string; color?: string }): Promise<LabelRecord | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (data.name !== undefined) { sets.push(`name = $${idx++}`); params.push(data.name); }
    if (data.color !== undefined) { sets.push(`color = $${idx++}`); params.push(data.color); }
    if (sets.length === 0) return this.findById(tenantId, labelId);
    params.push(labelId, tenantId);
    const result = await this.db.query<LabelRecord>(
      enforceTenantScope(`UPDATE labels SET ${sets.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx} RETURNING *`, tenantId),
      params,
    );
    return result.rows[0] ?? null;
  }

  async delete(tenantId: string, labelId: string): Promise<boolean> {
    const result = await this.db.query(
      enforceTenantScope('DELETE FROM labels WHERE id = $1 AND tenant_id = $2', tenantId),
      [labelId, tenantId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getTaskLabels(tenantId: string, taskId: string): Promise<LabelRecord[]> {
    const result = await this.db.query<LabelRecord>(
      enforceTenantScope(
        `SELECT l.* FROM labels l
         JOIN task_labels tl ON tl.label_id = l.id
         WHERE tl.tenant_id = $1 AND tl.task_id = $2 ORDER BY l.name`,
        tenantId,
      ),
      [tenantId, taskId],
    );
    return result.rows;
  }

  async setTaskLabels(tenantId: string, taskId: string, labelIds: string[]): Promise<void> {
    await this.db.query(
      enforceTenantScope('DELETE FROM task_labels WHERE tenant_id = $1 AND task_id = $2', tenantId),
      [tenantId, taskId],
    );
    if (labelIds.length === 0) return;
    const values = labelIds.map((_, i) => `($1, $2, $${i + 3})`).join(', ');
    await this.db.query(
      enforceTenantScope(`INSERT INTO task_labels (tenant_id, task_id, label_id) VALUES ${values} ON CONFLICT DO NOTHING`, tenantId),
      [tenantId, taskId, ...labelIds],
    );
  }
}
