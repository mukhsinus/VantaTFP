import { z } from 'zod';

export const reportTypeSchema = z.enum(['KPI', 'PAYROLL', 'TASKS']);
export const reportFormatSchema = z.enum(['json', 'csv', 'pdf']);

export const generateReportSchema = z.object({
  type: reportTypeSchema,
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  userId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
});

export const exportReportSchema = generateReportSchema.extend({
  format: reportFormatSchema,
});

export const listReportHistorySchema = z.object({
  type: reportTypeSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type ExportReportInput = z.infer<typeof exportReportSchema>;
export type ListReportHistoryQuery = z.infer<typeof listReportHistorySchema>;
