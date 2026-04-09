import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@entities/billing/billing.api';

const billingKeys = {
  all: ['billing'] as const,
  tenant: () => [...billingKeys.all, 'tenant'] as const,
};

export function useBillingSnapshot() {
  return useQuery({
    queryKey: billingKeys.tenant(),
    queryFn: billingApi.snapshot,
  });
}
