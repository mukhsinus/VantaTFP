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

/** Pro analytics: `teamId` is the manager's user id (direct reports). */
export const kpiAnalyticsQuerySchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  userId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  refresh: z.coerce.boolean().optional().default(true),
});

export type KpiIdParam = z.infer<typeof kpiIdParamSchema>;
export type ListKpiQuery = z.infer<typeof listKpiQuerySchema>;
export type KpiCalculationParams = z.infer<typeof kpiCalculationParamsSchema>;
export type KpiCalculationQuery = z.infer<typeof kpiCalculationQuerySchema>;
export type KpiAnalyticsQuery = z.infer<typeof kpiAnalyticsQuerySchema>;
