import { z } from 'zod';

// Object type enum
export const ObjectTypeEnum = z.enum(['equipment', 'department', 'vehicle', 'location', 'facility', 'asset', 'other']);
export type ObjectType = z.infer<typeof ObjectTypeEnum>;

// Task status enum
export const ObjectTaskStatusEnum = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export type ObjectTaskStatus = z.infer<typeof ObjectTaskStatusEnum>;

// Task priority enum
export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

// ===== OBJECT SCHEMAS =====

export const createObjectInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().optional().nullable(),
  object_type: ObjectTypeEnum,
  status: z.string().default('active').optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type CreateObjectInput = z.infer<typeof createObjectInputSchema>;

export const updateObjectInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long').optional(),
  description: z.string().optional().nullable(),
  object_type: ObjectTypeEnum.optional(),
  status: z.string().optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type UpdateObjectInput = z.infer<typeof updateObjectInputSchema>;

export const listObjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  object_type: ObjectTypeEnum.optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'name', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListObjectsQuery = z.infer<typeof listObjectsQuerySchema>;

export const objectIdParamSchema = z.object({
  objectId: z.string().uuid('Invalid object ID'),
});

export type ObjectIdParam = z.infer<typeof objectIdParamSchema>;

// ===== OBJECT TASK SCHEMAS =====

export const createObjectTaskInputSchema = z.object({
  object_id: z.string().uuid('Invalid object ID'),
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().optional().nullable(),
  assigned_to: z.string().uuid('Invalid user ID').optional().nullable(),
  status: ObjectTaskStatusEnum.default('pending'),
  priority: TaskPriorityEnum.default('medium'),
  due_date: z.coerce.date().optional().nullable(),
  estimated_duration_minutes: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type CreateObjectTaskInput = z.infer<typeof createObjectTaskInputSchema>;

export const updateObjectTaskInputSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  status: ObjectTaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  due_date: z.coerce.date().optional().nullable(),
  estimated_duration_minutes: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type UpdateObjectTaskInput = z.infer<typeof updateObjectTaskInputSchema>;

export const startObjectTaskInputSchema = z.object({
  task_id: z.string().uuid('Invalid task ID'),
});

export type StartObjectTaskInput = z.infer<typeof startObjectTaskInputSchema>;

export const completeObjectTaskInputSchema = z.object({
  task_id: z.string().uuid('Invalid task ID'),
  notes: z.string().optional().nullable(),
});

export type CompleteObjectTaskInput = z.infer<typeof completeObjectTaskInputSchema>;

export const listObjectTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  object_id: z.string().uuid().optional(),
  status: ObjectTaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  assigned_to: z.string().uuid().optional(),
  sort_by: z.enum(['created_at', 'due_date', 'priority', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListObjectTasksQuery = z.infer<typeof listObjectTasksQuerySchema>;

export const objectTaskIdParamSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
});

export type ObjectTaskIdParam = z.infer<typeof objectTaskIdParamSchema>;

// ===== RESPONSE SCHEMAS =====

export const objectResponseSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  object_type: ObjectTypeEnum,
  status: z.string(),
  metadata: z.record(z.unknown()).nullable(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type ObjectResponse = z.infer<typeof objectResponseSchema>;

export const objectTaskResponseSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  object_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  assigned_to: z.string().uuid().nullable(),
  status: ObjectTaskStatusEnum,
  priority: TaskPriorityEnum,
  due_date: z.date().nullable(),
  completed_at: z.date().nullable(),
  started_at: z.date().nullable(),
  estimated_duration_minutes: z.number().nullable(),
  actual_duration_minutes: z.number().nullable(),
  notes: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type ObjectTaskResponse = z.infer<typeof objectTaskResponseSchema>;
