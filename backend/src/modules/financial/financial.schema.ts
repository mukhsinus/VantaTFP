import { z } from 'zod';

export const walletIdParamSchema = z.object({ id: z.string().uuid() });
export const payoutIdParamSchema = z.object({ id: z.string().uuid() });

export const createPayoutSchema = z.object({
  recipientId: z.string().uuid(),
  amount: z.number().positive(),
  payrollId: z.string().uuid().optional(),
  payoutMethod: z.string().max(50).optional(),
  idempotencyKey: z.string().max(255).optional(),
});

export type CreatePayoutBody = z.infer<typeof createPayoutSchema>;
