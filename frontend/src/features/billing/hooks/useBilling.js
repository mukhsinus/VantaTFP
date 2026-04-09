import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@entities/billing/billing.api';
const billingKeys = {
    all: ['billing'],
    tenant: () => [...billingKeys.all, 'tenant'],
};
export function useBillingSnapshot() {
    return useQuery({
        queryKey: billingKeys.tenant(),
        queryFn: billingApi.snapshot,
    });
}
