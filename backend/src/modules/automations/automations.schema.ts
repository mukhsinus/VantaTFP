import { z } from 'zod';

export const TRIGGER_TYPES = ['task_status_changed', 'task_created', 'task_assigned', 'task_due_soon', 'task_overdue', 'comment_added'] as const;
export const ACTION_TYPES = ['change_status', 'assign_user', 'add_label', 'send_notification', 'move_to_project', 'set_priority', 'create_subtask'] as const;

export const createAutomationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  triggerType: z.enum(TRIGGER_TYPES),
  triggerConfig: z.record(z.unknown()).default({}),
  actionType: z.enum(ACTION_TYPES),
  actionConfig: z.record(z.unknown()).default({}),
  active: z.boolean().default(true),
});

export const updateAutomationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  triggerType: z.enum(TRIGGER_TYPES).optional(),
  triggerConfig: z.record(z.unknown()).optional(),
  actionType: z.enum(ACTION_TYPES).optional(),
  actionConfig: z.record(z.unknown()).optional(),
  active: z.boolean().optional(),
});

export const listAutomationsQuerySchema = z.object({
  active: z.preprocess((v) => v === 'true', z.boolean()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationInput = z.infer<typeof updateAutomationSchema>;
export type ListAutomationsQuery = z.infer<typeof listAutomationsQuerySchema>;
