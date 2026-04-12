import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  defaultPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  checklist: z.array(z.string().max(500)).max(50).default([]),
  defaultLabels: z.array(z.string().uuid()).max(20).default([]),
  defaultEstimatePoints: z.number().int().min(0).max(100).optional(),
  defaultEstimateMinutes: z.number().int().min(0).max(99999).optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  defaultPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  checklist: z.array(z.string().max(500)).max(50).optional(),
  defaultLabels: z.array(z.string().uuid()).max(20).optional(),
  defaultEstimatePoints: z.number().int().min(0).max(100).nullable().optional(),
  defaultEstimateMinutes: z.number().int().min(0).max(99999).nullable().optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
