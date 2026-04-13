import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@features/billing/billing.service';
import { billingKeys } from '@features/billing/billing.query-keys';
import type { BillingPlanId } from '@entities/billing/billing.types';

/**
 * Current tenant billing (plan, status, trial, usage vs limits). All values come from the API.
 */
export function useBilling(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.current(),
    queryFn: () => billingService.getCurrent(),
    enabled: options?.enabled ?? true,
    /** Global QueryClient sets refetchOnMount: false; billing must refresh when opening the page. */
    refetchOnMount: 'always',
  });
}

/**
 * Owner-only plan upgrade; invalidates billing queries on success.
 */
export function useBillingUpgrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: BillingPlanId) => billingService.upgrade(plan),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}
