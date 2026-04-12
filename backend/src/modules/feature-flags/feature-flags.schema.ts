import { z } from 'zod';

// ── Feature flag keys ─────────────────────────────────────────────────────
export const FEATURE_KEYS = [
  'projects', 'subtasks', 'comments', 'labels', 'custom_fields',
  'dependencies', 'multiple_assignees', 'templates', 'estimates',
  'documents', 'attachments', 'recurring_tasks', 'calendar_view',
  'timeline_view', 'automations', 'time_tracking',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const featureKeySchema = z.enum(FEATURE_KEYS);

export const updateFeatureFlagSchema = z.object({
  featureKey: featureKeySchema,
  enabled: z.boolean(),
});

export const bulkUpdateFeatureFlagsSchema = z.object({
  flags: z.array(updateFeatureFlagSchema).min(1).max(50),
});

export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;
export type BulkUpdateFeatureFlagsInput = z.infer<typeof bulkUpdateFeatureFlagsSchema>;
