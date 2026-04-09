import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { BillingSnapshotDto } from './billing.types';

export const billingApi = {
  snapshot: (): Promise<BillingSnapshotDto> =>
    apiClient.get<BillingSnapshotDto>(API.billing.snapshot),
};
