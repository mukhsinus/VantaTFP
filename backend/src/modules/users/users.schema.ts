import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['MANAGER', 'EMPLOYEE']),
  password: z.string().min(8),
  managerId: z.string().uuid().optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'EMPLOYEE']).default('EMPLOYEE'),
  password: z.string().min(4).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['MANAGER', 'EMPLOYEE']).optional(),
  managerId: z.string().uuid().nullable().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateMyProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
});

export const updateMyPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const updateMyNotificationsSchema = z.object({
  overdue_tasks: z.boolean(),
  new_tasks: z.boolean(),
  kpi_updates: z.boolean(),
  payroll_requests: z.boolean(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type InviteUserDto = z.infer<typeof inviteUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateMyProfileDto = z.infer<typeof updateMyProfileSchema>;
export type UpdateMyPasswordDto = z.infer<typeof updateMyPasswordSchema>;
export type UpdateMyNotificationsDto = z.infer<typeof updateMyNotificationsSchema>;
