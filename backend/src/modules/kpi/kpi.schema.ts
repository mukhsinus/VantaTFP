import { z } from 'zod';

export const kpiPeriodSchema = z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']);

export const createKpiSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  targetValue: z.number().positive(),
  unit: z.string().min(1),
  period: kpiPeriodSchema,
  assigneeId: z.string().uuid(),
});

export const updateKpiSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  targetValue: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  period: kpiPeriodSchema.optional(),
});

export const recordKpiProgressSchema = z.object({
  actualValue: z.number(),
  recordedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const kpiIdParamSchema = z.object({
  kpiId: z.string().uuid(),
});

export const listKpiQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateKpiDto = z.infer<typeof createKpiSchema>;
export type UpdateKpiDto = z.infer<typeof updateKpiSchema>;
export type RecordKpiProgressDto = z.infer<typeof recordKpiProgressSchema>;
export type KpiIdParam = z.infer<typeof kpiIdParamSchema>;
export type ListKpiQuery = z.infer<typeof listKpiQuerySchema>;
