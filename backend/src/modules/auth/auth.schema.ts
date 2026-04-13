import { z } from 'zod';

/**
 * Employee password: min 4 chars, no complexity requirements (per spec).
 * Employer password: min 8 chars (reasonable default, spec only says "required").
 */
export const employeePasswordSchema = z
  .string()
  .min(4, 'Password must be at least 4 characters');

export const employerPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

export const loginRequestSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(4).optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((d) => d.email || d.phone, {
    message: 'Either email or phone is required',
  });

/** Public employer self-registration — creates tenant + owner + 15-day trial */
export const registerEmployerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email().optional(),
  phone: z.string().min(4).optional(),
  password: employerPasswordSchema,
  companyName: z.string().min(1, 'Company name is required').max(255),
});

/** Invite-based registration (legacy — kept for backward compatibility) */
export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  inviteToken: z.string().min(1, 'Invite token required (registration requires valid invite)'),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterEmployerRequest = z.infer<typeof registerEmployerSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
