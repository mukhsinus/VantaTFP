import { z } from 'zod';

export const payrollStatusSchema = z.enum(['DRAFT', 'APPROVED', 'PAID', 'CANCELLED']);

export const payrollRuleTypeSchema = z.enum(['fixed', 'per_task', 'kpi_based']);

export const fixedRuleConfigSchema = z.object({
  amount: z.number().nonnegative(),
});

export const perTaskRuleConfigSchema = z.object({
  ratePerTask: z.number().nonnegative(),
});

export const kpiBasedRuleConfigSchema = z.object({
  /** Overrides `PAYROLL_DEFAULT_BASE_SALARY` when KPI data exists. */
  baseSalary: z.number().nonnegative().optional(),
});

export const payrollIdParamSchema = z.object({
  payrollId: z.string().uuid(),
});

export const payrollRuleIdParamSchema = z.object({
  ruleId: z.string().uuid(),
});

export const listPayrollQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: payrollStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createPayrollRuleSchema = z
  .object({
    name: z.string().max(200).optional(),
    type: payrollRuleTypeSchema,
    config: z.record(z.unknown()),
  })
  .superRefine((data, ctx) => {
    const parsed = parsePayrollRuleConfig(data.type, data.config);
    if (!parsed.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: parsed.error,
        path: ['config'],
      });
    }
  });

export const updatePayrollRuleSchema = z
  .object({
    name: z.string().max(200).optional(),
    config: z.record(z.unknown()).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required',
  });

export const applyPayrollRuleBodySchema = z.object({
  userId: z.string().uuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export const listPayrollRulesQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional().default(false),
});

export const listPayrollRecordsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export function parsePayrollRuleConfig(
  type: z.infer<typeof payrollRuleTypeSchema>,
  config: unknown
):
  | { ok: true; config: Record<string, unknown> }
  | { ok: false; error: string } {
  try {
    if (type === 'fixed') {
      return { ok: true, config: fixedRuleConfigSchema.parse(config) as unknown as Record<string, unknown> };
    }
    if (type === 'per_task') {
      return {
        ok: true,
        config: perTaskRuleConfigSchema.parse(config) as unknown as Record<string, unknown>,
      };
    }
    return {
      ok: true,
      config: kpiBasedRuleConfigSchema.parse(config) as unknown as Record<string, unknown>,
    };
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.flatten().formErrors.join('; ') : 'Invalid config';
    return { ok: false, error: msg };
  }
}

export type PayrollIdParam = z.infer<typeof payrollIdParamSchema>;
export type ListPayrollQuery = z.infer<typeof listPayrollQuerySchema>;
export type CreatePayrollRuleInput = z.infer<typeof createPayrollRuleSchema>;
export type UpdatePayrollRuleInput = z.infer<typeof updatePayrollRuleSchema>;
export type ApplyPayrollRuleBody = z.infer<typeof applyPayrollRuleBodySchema>;
