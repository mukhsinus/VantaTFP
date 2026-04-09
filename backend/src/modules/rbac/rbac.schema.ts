import { z } from 'zod';

export const roleIdParamSchema = z.object({
  roleId: z.string().uuid(),
});

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  code: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[A-Z0-9_]+$/),
  permissionIds: z.array(z.string().uuid()).default([]),
});

export const updateRoleSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    permissionIds: z.array(z.string().uuid()).optional(),
  })
  .refine((value) => value.name !== undefined || value.permissionIds !== undefined, {
    message: 'At least one field is required',
  });

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
