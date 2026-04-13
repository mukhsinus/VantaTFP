import { z } from 'zod';

export const billingUpgradeBodySchema = z.object({
  plan: z.enum(['basic', 'pro', 'business', 'enterprise']),
});

export type BillingUpgradeBody = z.infer<typeof billingUpgradeBodySchema>;
