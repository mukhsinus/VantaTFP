import { z } from 'zod';

export const payrollStatusSchema = z.enum(['DRAFT', 'APPROVED', 'PAID', 'CANCELLED']);

export const createPayrollEntrySchema = z.object({
  employeeId: z.string().uuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  baseSalary: z.number().nonnegative(),
  bonuses: z.number().nonnegative().default(0),
  deductions: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export const updatePayrollEntrySchema = z.object({
  baseSalary: z.number().nonnegative().optional(),
  bonuses: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  status: payrollStatusSchema.optional(),
});

export const payrollIdParamSchema = z.object({
  payrollId: z.string().uuid(),
});

export const listPayrollQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: payrollStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreatePayrollEntryDto = z.infer<typeof createPayrollEntrySchema>;
export type UpdatePayrollEntryDto = z.infer<typeof updatePayrollEntrySchema>;
export type PayrollIdParam = z.infer<typeof payrollIdParamSchema>;
export type ListPayrollQuery = z.infer<typeof listPayrollQuerySchema>;
