import { z } from 'zod';

/** Payment card displayed to users for manual payment (per spec) */
export const PAYMENT_CARD_NUMBER = '5614681626029502';

export const createPaymentRequestSchema = z.object({
  plan: z.enum(['basic', 'pro', 'business', 'enterprise']),
  proof: z.string().max(1000).optional(),
});

export const confirmPaymentRequestSchema = z.object({
  adminNote: z.string().max(500).optional(),
});

export const rejectPaymentRequestSchema = z.object({
  adminNote: z.string().max(500).optional(),
});

export const paymentRequestIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreatePaymentRequestBody = z.infer<typeof createPaymentRequestSchema>;
export type ConfirmPaymentRequestBody = z.infer<typeof confirmPaymentRequestSchema>;
