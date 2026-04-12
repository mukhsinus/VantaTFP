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

export type PatchEmployeeRoleDto = z.infer<typeof patchEmployeeRoleBodySchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
