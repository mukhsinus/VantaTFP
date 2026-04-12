import { FeatureFlagsRepository, FeatureFlagRecord } from './feature-flags.repository.js';
import { FeatureKey, FEATURE_KEYS } from './feature-flags.schema.js';

export interface FeatureFlagResponse {
  featureKey: string;
  enabled: boolean;
}

export interface FeatureFlagsMap {
  [key: string]: boolean;
}

export class FeatureFlagsService {
  constructor(private readonly repo: FeatureFlagsRepository) {}

  async getAll(tenantId: string): Promise<FeatureFlagsMap> {
    const rows = await this.repo.ensureDefaults(tenantId);
    const map: FeatureFlagsMap = {};
    for (const key of FEATURE_KEYS) {
      const row = rows.find((r) => r.feature_key === key);
      map[key] = row ? row.enabled : true;
    }
    return map;
  }

  async update(tenantId: string, featureKey: FeatureKey, enabled: boolean): Promise<FeatureFlagResponse> {
    const row = await this.repo.upsert(tenantId, featureKey, enabled);
    return this.toResponse(row);
  }

  async bulkUpdate(tenantId: string, flags: { featureKey: FeatureKey; enabled: boolean }[]): Promise<FeatureFlagsMap> {
    for (const f of flags) {
      await this.repo.upsert(tenantId, f.featureKey, f.enabled);
    }
    return this.getAll(tenantId);
  }

  private toResponse(row: FeatureFlagRecord): FeatureFlagResponse {
    return { featureKey: row.feature_key, enabled: row.enabled };
  }
}
