import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type {
  BillingCurrentDto,
  BillingPlanId,
} from './billing.types';

export const billingService = {
  getCurrent: (): Promise<BillingCurrentDto> =>
    apiClient.get<BillingCurrentDto>(API.billing.current),

  upgrade: (plan: BillingPlanId): Promise<{
    ok: boolean;
    pending_payment: { id: string; plan: string; status: 'pending'; amount: number };
  }> => apiClient.post(API.billing.upgrade, { plan }),
};
