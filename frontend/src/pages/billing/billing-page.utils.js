export const PLAN_ORDER = ['basic', 'pro', 'unlimited'];

export function sortPlans(catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return [];
  }

  const byName = new Map();
  for (const plan of catalog) {
    if (plan && typeof plan.name === 'string') {
      byName.set(plan.name, plan);
    }
  }

  const known = PLAN_ORDER.map((name) => byName.get(name)).filter(Boolean);
  return known.length > 0 ? known : [...catalog];
}

export function shouldShowBillingFullSkeleton({
  billingData,
  billingIsError,
  billingIsPending,
  billingIsFetching,
}) {
  if (billingIsError) return false;
  if (billingData !== undefined && billingData !== null) return false;
  return Boolean(billingIsPending || billingIsFetching);
}
