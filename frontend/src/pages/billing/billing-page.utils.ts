import type { BillingPlanCatalogItem, BillingPlanId } from '@entities/billing/billing.types';

export const PLAN_ORDER: BillingPlanId[] = ['basic', 'pro', 'business', 'enterprise'];

/**
 * Sort catalog by known tier order; if names differ, keep any valid rows from the API.
 */
export function sortPlans(catalog: BillingPlanCatalogItem[] | undefined): BillingPlanCatalogItem[] {
  if (!catalog?.length) return [];
  const ordered = PLAN_ORDER.map((name) => catalog.find((p) => p.name === name)).filter(
    (p): p is BillingPlanCatalogItem => Boolean(p)
  );
  if (ordered.length > 0) return ordered;
  return catalog.filter(
    (p): p is BillingPlanCatalogItem =>
      Boolean(p && typeof p === 'object' && 'name' in p && 'price' in p)
  );
}

/**
 * Full-page billing skeleton: only while the first billing payload has not arrived and we are not in error.
 * Do not use `plans` loading here — plans can hang or race separately and would block the whole page forever.
 */
export function shouldShowBillingFullSkeleton(params: {
  billingData: unknown;
  billingIsError: boolean;
  billingIsPending: boolean;
  billingIsFetching: boolean;
}): boolean {
  if (params.billingIsError) return false;
  if (params.billingData != null) return false;
  return params.billingIsPending || params.billingIsFetching;
}
