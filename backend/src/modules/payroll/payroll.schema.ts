import { z } from 'zod';

export const payrollStatusSchema = z.enum(['DRAFT', 'APPROVED', 'PAID', 'CANCELLED']);

export const payrollIdParamSchema = z.object({
  payrollId: z.string().uuid(),
});

export const listPayrollQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: payrollStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PayrollIdParam = z.infer<typeof payrollIdParamSchema>;
export type ListPayrollQuery = z.infer<typeof listPayrollQuerySchema>;
