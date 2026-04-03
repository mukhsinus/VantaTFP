import { z } from 'zod';

export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  priority: taskPrioritySchema.default('MEDIUM'),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
});

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
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
