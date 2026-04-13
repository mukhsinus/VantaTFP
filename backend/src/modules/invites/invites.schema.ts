import { z } from 'zod';
import { employerPasswordSchema } from '../auth/auth.schema.js';

/** POST /invites — only manager/employee; default employee; owner cannot be invited. */
export const createLinkInviteBodySchema = z.object({
  role: z.enum(['manager', 'employee']).default('employee'),
});

export const acceptInviteBodySchema = z.object({
  token: z.string().uuid(),
  email: z.string().email(),
  password: employerPasswordSchema,
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export type CreateLinkInviteDto = z.infer<typeof createLinkInviteBodySchema>;
export type AcceptInviteDto = z.infer<typeof acceptInviteBodySchema>;
