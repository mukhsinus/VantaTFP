export const PLAN_ORDER = ['basic', 'pro', 'unlimited'];
/**
 * Sort catalog by known tier order; if names differ, keep any valid rows from the API.
 */
export function sortPlans(catalog) {
    if (!catalog?.length)
        return [];
    const ordered = PLAN_ORDER.map((name) => catalog.find((p) => p.name === name)).filter((p) => Boolean(p));
    if (ordered.length > 0)
        return ordered;
    return catalog.filter((p) => Boolean(p && typeof p === 'object' && 'name' in p && 'price' in p));
}
/**
 * Full-page billing skeleton: only while the first billing payload has not arrived and we are not in error.
 * Do not use `plans` loading here — plans can hang or race separately and would block the whole page forever.
 */
export function shouldShowBillingFullSkeleton(params) {
    if (params.billingIsError)
        return false;
    if (params.billingData != null)
        return false;
    return params.billingIsPending || params.billingIsFetching;
}
