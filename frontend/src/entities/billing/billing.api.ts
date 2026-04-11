import { billingService } from './billing.service';

/**
 * @deprecated Prefer `billingService` from `@entities/billing/billing.service`.
 */
export const billingApi = {
  snapshot: billingService.getSnapshot,
  getCurrent: billingService.getCurrent,
  getPlans: billingService.getPlans,
  upgrade: billingService.upgrade,
};
