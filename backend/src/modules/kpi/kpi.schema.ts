import { z } from 'zod';

export const kpiCalculationParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const kpiCalculationQuerySchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export const kpiIdParamSchema = z.object({
  kpiId: z.string().uuid(),
});

export const listKpiQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type KpiIdParam = z.infer<typeof kpiIdParamSchema>;
export type ListKpiQuery = z.infer<typeof listKpiQuerySchema>;
export type KpiCalculationParams = z.infer<typeof kpiCalculationParamsSchema>;
export type KpiCalculationQuery = z.infer<typeof kpiCalculationQuerySchema>;
