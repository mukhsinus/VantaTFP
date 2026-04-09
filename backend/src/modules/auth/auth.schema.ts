import { z } from 'zod';

/**
 * Password validation rules:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
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
  /** Legacy email-bound invite (tenant_invites). Prefer POST /api/v1/invites/accept-invite with UUID token. */
  inviteToken: z.string().min(1, 'Invite token required (registration requires valid invite)'),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
