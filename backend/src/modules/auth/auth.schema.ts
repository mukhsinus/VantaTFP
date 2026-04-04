import { z } from 'zod';

/**
 * Password validation rules:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(
    /[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]/,
    'Password must contain special character'
  );

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  inviteToken: z.string().min(1, 'Invite token required (registration requires valid invite)'),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const createTenantInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
export type CreateTenantInviteDto = z.infer<typeof createTenantInviteSchema>;
