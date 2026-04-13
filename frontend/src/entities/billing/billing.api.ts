import { billingService } from './billing.service';

/**
 * @deprecated Prefer `billingService` from `@entities/billing/billing.service`.
 */
export const billingApi = {
  getCurrent: billingService.getCurrent,
  upgrade: billingService.upgrade,
};
