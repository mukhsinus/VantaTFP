import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).default('FREE'),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
});

export const tenantIdParamSchema = z.object({
  tenantId: z.string().uuid(),
});

export const listTenantsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTenantDto = z.infer<typeof createTenantSchema>;
export type UpdateTenantDto = z.infer<typeof updateTenantSchema>;
export type TenantIdParam = z.infer<typeof tenantIdParamSchema>;
export type ListTenantsQuery = z.infer<typeof listTenantsQuerySchema>;
