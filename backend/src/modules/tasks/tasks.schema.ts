import { z } from 'zod';

export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']);
export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

const createTaskRawSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  assignee_id: z.string().uuid().optional(),
  deadline: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  priority: taskPrioritySchema.default('MEDIUM'),
});

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  deadline: z.string().datetime().optional(),
  priority: taskPrioritySchema.default('MEDIUM'),
}).transform((data) => data);

export const createTaskInputSchema = createTaskRawSchema.transform((data) => ({
  title: data.title,
  description: data.description,
  assigneeId: data.assigneeId ?? data.assignee_id,
  deadline: data.deadline ?? data.dueDate,
  priority: data.priority,
}));

const updateTaskRawSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
}).transform((data) => data);

export const updateTaskInputSchema = updateTaskRawSchema.transform((data) => ({
  title: data.title,
  description: data.description,
  assigneeId: data.assigneeId ?? data.assignee_id,
  deadline: data.deadline ?? data.dueDate,
  completedAt: data.completedAt ?? data.completed_at,
  priority: data.priority,
  status: data.status,
}));

export const taskIdParamSchema = z.object({
  taskId: z.string().uuid(),
});

export const listTasksQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  assigneeId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
