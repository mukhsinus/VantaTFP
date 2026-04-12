export type FeatureKey =
  | 'projects' | 'subtasks' | 'comments' | 'labels' | 'custom_fields'
  | 'dependencies' | 'multiple_assignees' | 'templates' | 'estimates'
  | 'documents' | 'attachments' | 'recurring_tasks' | 'calendar_view'
  | 'timeline_view' | 'automations' | 'time_tracking';

export type FeatureFlagsMap = Record<string, boolean>;

export interface UpdateFeatureFlagPayload {
  featureKey: FeatureKey;
  enabled: boolean;
}
