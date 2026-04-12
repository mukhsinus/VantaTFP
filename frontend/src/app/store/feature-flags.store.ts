import { create } from 'zustand';
import { featureFlagsApi } from '@entities/feature-flags/feature-flags.api';
import type { FeatureFlagsMap, FeatureKey } from '@entities/feature-flags/feature-flags.types';

interface FeatureFlagsState {
  flags: FeatureFlagsMap;
  loaded: boolean;
  loading: boolean;
  loadFlags: () => Promise<void>;
  isEnabled: (key: FeatureKey) => boolean;
  updateFlag: (key: FeatureKey, enabled: boolean) => Promise<void>;
}

export const useFeatureFlagsStore = create<FeatureFlagsState>((set, get) => ({
  flags: {},
  loaded: false,
  loading: false,

  loadFlags: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const flags = await featureFlagsApi.list();
      set({ flags, loaded: true, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  isEnabled: (key: FeatureKey): boolean => {
    const flags = get().flags;
    // Default to true if not loaded yet (features visible by default)
    return flags[key] ?? true;
  },

  updateFlag: async (key: FeatureKey, enabled: boolean) => {
    await featureFlagsApi.update({ featureKey: key, enabled });
    set((state) => ({
      flags: { ...state.flags, [key]: enabled },
    }));
  },
}));

/** Convenience hook — returns whether a feature is enabled */
export function useFeature(key: FeatureKey): boolean {
  return useFeatureFlagsStore((s) => s.isEnabled(key));
}
