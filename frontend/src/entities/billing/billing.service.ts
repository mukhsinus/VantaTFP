import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type {
  BillingCurrentDto,
  BillingPlansCatalogDto,
  BillingSnapshotDto,
  BillingPlanId,
} from './billing.types';

export const billingService = {
  /** Legacy snapshot shape; prefer {@link getCurrent} for new UI. */
  getSnapshot: (): Promise<BillingSnapshotDto> =>
    apiClient.get<BillingSnapshotDto>(API.billing.snapshot),

  getCurrent: (): Promise<BillingCurrentDto> =>
    apiClient.get<BillingCurrentDto>(API.billing.current),

  getPlans: (): Promise<BillingPlansCatalogDto> =>
    apiClient.get<BillingPlansCatalogDto>(API.billing.plans),

  upgrade: (plan: BillingPlanId): Promise<{
    ok: boolean;
    payment_request: { id: string; status: 'pending'; amount: number };
  }> => apiClient.post(API.billing.upgrade, { plan }),
};
