import { z } from 'zod';

export const billingUpgradeBodySchema = z.object({
  plan: z.enum(['basic', 'pro', 'unlimited']),
});

export type BillingUpgradeBody = z.infer<typeof billingUpgradeBodySchema>;
