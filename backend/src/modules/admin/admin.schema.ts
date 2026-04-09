import { z } from 'zod';

export const listAuditLogsQuerySchema = z.object({
  action: z.string().min(1).optional(),
  entity: z.string().min(1).optional(),
  userId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateTenantAdminSchema = z
  .object({
    name: z.string().min(2).optional(),
    plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
  })
  .refine((v) => v.name !== undefined || v.plan !== undefined, {
    message: 'At least one field is required',
  });

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
export type UpdateTenantAdminDto = z.infer<typeof updateTenantAdminSchema>;
