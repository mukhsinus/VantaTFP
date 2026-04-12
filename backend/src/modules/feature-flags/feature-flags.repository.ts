import { Pool } from 'pg';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';
import { FeatureKey, FEATURE_KEYS } from './feature-flags.schema.js';

export interface FeatureFlagRecord {
  id: string;
  tenant_id: string;
  feature_key: FeatureKey;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export class FeatureFlagsRepository {
  constructor(private readonly db: Pool) {}

  async getAllForTenant(tenantId: string): Promise<FeatureFlagRecord[]> {
    const result = await this.db.query<FeatureFlagRecord>(
      enforceTenantScope(
        `SELECT id, tenant_id, feature_key, enabled, created_at, updated_at
         FROM feature_flags WHERE tenant_id = $1 ORDER BY feature_key`,
        tenantId,
      ),
      [tenantId],
    );
    return result.rows;
  }

  async upsert(tenantId: string, featureKey: FeatureKey, enabled: boolean): Promise<FeatureFlagRecord> {
    const result = await this.db.query<FeatureFlagRecord>(
      enforceTenantScope(
        `INSERT INTO feature_flags (tenant_id, feature_key, enabled)
         VALUES ($1, $2, $3)
         ON CONFLICT (tenant_id, feature_key) DO UPDATE SET enabled = $3, updated_at = NOW()
         RETURNING *`,
        tenantId,
      ),
      [tenantId, featureKey, enabled],
    );
    return result.rows[0];
  }

  async ensureDefaults(tenantId: string): Promise<FeatureFlagRecord[]> {
    // Insert default enabled rows for all known keys that don't exist yet
    const values = FEATURE_KEYS.map((_, i) => `($1, $${i + 2}, true)`).join(', ');
    await this.db.query(
      enforceTenantScope(
        `INSERT INTO feature_flags (tenant_id, feature_key, enabled)
         VALUES ${values}
         ON CONFLICT (tenant_id, feature_key) DO NOTHING`,
        tenantId,
      ),
      [tenantId, ...FEATURE_KEYS],
    );
    return this.getAllForTenant(tenantId);
  }
}
