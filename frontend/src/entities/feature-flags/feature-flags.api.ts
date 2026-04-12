import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { FeatureFlagsMap, UpdateFeatureFlagPayload } from './feature-flags.types';

export const featureFlagsApi = {
  list: (): Promise<FeatureFlagsMap> =>
    apiClient.get<FeatureFlagsMap>(API.featureFlags.list),

  update: (payload: UpdateFeatureFlagPayload): Promise<{ featureKey: string; enabled: boolean }> =>
    apiClient.patch<{ featureKey: string; enabled: boolean }>(API.featureFlags.update, payload),

  bulkUpdate: (flags: UpdateFeatureFlagPayload[]): Promise<FeatureFlagsMap> =>
    apiClient.put<FeatureFlagsMap>(API.featureFlags.bulk, { flags }),
};
