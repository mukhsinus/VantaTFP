import { z } from 'zod';

export const patchEmployeeRoleBodySchema = z.object({
  role: z.enum(['manager', 'employee']),
});

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const employeeIdParamSchema = z.object({
  id: z.string().uuid(),
});

/** Employer creates an employee — phone is the unique identifier (per spec) */
export const createEmployeeBodySchema = z.object({
  phone: z.string().min(4, 'Phone is required').max(30),
  name: z.string().max(255).optional(),
  roleDescription: z.string().max(255).optional(),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: z.enum(['manager', 'employee']).default('employee'),
});

export type PatchEmployeeRoleDto = z.infer<typeof patchEmployeeRoleBodySchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type CreateEmployeeBody = z.infer<typeof createEmployeeBodySchema>;
