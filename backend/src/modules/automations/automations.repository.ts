import { Pool } from 'pg';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';
import { ListAutomationsQuery } from './automations.schema.js';

export interface AutomationRecord {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  active: boolean;
  execution_count: number;
  last_executed_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export class AutomationsRepository {
  constructor(private readonly db: Pool) {}

  async findAll(tenantId: string, query: ListAutomationsQuery): Promise<AutomationRecord[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let idx = 2;
    if (query.active !== undefined) { conditions.push(`active = $${idx++}`); params.push(query.active); }
    const offset = (query.page - 1) * query.limit;
    params.push(query.limit, offset);
    const result = await this.db.query<AutomationRecord>(
      enforceTenantScope(
        `SELECT * FROM automation_rules WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
        tenantId,
      ),
      params,
    );
    return result.rows;
  }

  async count(tenantId: string): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      enforceTenantScope('SELECT COUNT(*) as count FROM automation_rules WHERE tenant_id = $1', tenantId),
      [tenantId],
    );
    return parseInt(result.rows[0].count, 10);
  }

  async findById(tenantId: string, ruleId: string): Promise<AutomationRecord | null> {
    const result = await this.db.query<AutomationRecord>(
      enforceTenantScope('SELECT * FROM automation_rules WHERE id = $1 AND tenant_id = $2', tenantId),
      [ruleId, tenantId],
    );
    return result.rows[0] ?? null;
  }

  async findActiveByTrigger(tenantId: string, triggerType: string): Promise<AutomationRecord[]> {
    const result = await this.db.query<AutomationRecord>(
      enforceTenantScope(
        'SELECT * FROM automation_rules WHERE tenant_id = $1 AND trigger_type = $2 AND active = true',
        tenantId,
      ),
      [tenantId, triggerType],
    );
    return result.rows;
  }

  async create(data: Omit<AutomationRecord, 'id' | 'execution_count' | 'last_executed_at' | 'created_at' | 'updated_at'>): Promise<AutomationRecord> {
    const result = await this.db.query<AutomationRecord>(
      enforceTenantScope(
        `INSERT INTO automation_rules (tenant_id, name, description, trigger_type, trigger_config, action_type, action_config, active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        data.tenant_id,
      ),
      [data.tenant_id, data.name, data.description, data.trigger_type, JSON.stringify(data.trigger_config), data.action_type, JSON.stringify(data.action_config), data.active, data.created_by],
    );
    return result.rows[0];
  }

  async update(tenantId: string, ruleId: string, data: Partial<Pick<AutomationRecord, 'name' | 'description' | 'trigger_type' | 'trigger_config' | 'action_type' | 'action_config' | 'active'>>): Promise<AutomationRecord | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (data.name !== undefined) { sets.push(`name = $${idx++}`); params.push(data.name); }
    if (data.description !== undefined) { sets.push(`description = $${idx++}`); params.push(data.description); }
    if (data.trigger_type !== undefined) { sets.push(`trigger_type = $${idx++}`); params.push(data.trigger_type); }
    if (data.trigger_config !== undefined) { sets.push(`trigger_config = $${idx++}`); params.push(JSON.stringify(data.trigger_config)); }
    if (data.action_type !== undefined) { sets.push(`action_type = $${idx++}`); params.push(data.action_type); }
    if (data.action_config !== undefined) { sets.push(`action_config = $${idx++}`); params.push(JSON.stringify(data.action_config)); }
    if (data.active !== undefined) { sets.push(`active = $${idx++}`); params.push(data.active); }
    if (sets.length === 0) return this.findById(tenantId, ruleId);
    sets.push('updated_at = NOW()');
    params.push(ruleId, tenantId);
    const result = await this.db.query<AutomationRecord>(
      enforceTenantScope(`UPDATE automation_rules SET ${sets.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx} RETURNING *`, tenantId),
      params,
    );
    return result.rows[0] ?? null;
  }

  async incrementExecution(tenantId: string, ruleId: string): Promise<void> {
    await this.db.query(
      enforceTenantScope(
        'UPDATE automation_rules SET execution_count = execution_count + 1, last_executed_at = NOW() WHERE id = $1 AND tenant_id = $2',
        tenantId,
      ),
      [ruleId, tenantId],
    );
  }

  async delete(tenantId: string, ruleId: string): Promise<boolean> {
    const result = await this.db.query(
      enforceTenantScope('DELETE FROM automation_rules WHERE id = $1 AND tenant_id = $2', tenantId),
      [ruleId, tenantId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
