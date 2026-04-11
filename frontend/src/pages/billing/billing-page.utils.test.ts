import { describe, expect, it } from 'vitest';
import { PLAN_ORDER, shouldShowBillingFullSkeleton, sortPlans } from './billing-page.utils';
import type { BillingPlanCatalogItem } from '@entities/billing/billing.types';

describe('sortPlans', () => {
  it('returns empty for undefined or empty catalog', () => {
    expect(sortPlans(undefined)).toEqual([]);
    expect(sortPlans([])).toEqual([]);
  });

  it('orders basic, pro, unlimited when all present', () => {
    const catalog: BillingPlanCatalogItem[] = [
      { name: 'unlimited', price: 99 },
      { name: 'basic', price: 19, users: 5, tasks: 500 },
      { name: 'pro', price: 49, users: 15, tasks: 5000 },
    ];
    const sorted = sortPlans(catalog);
    expect(sorted.map((p) => p.name)).toEqual(PLAN_ORDER);
  });

  it('filters to known order subset when one tier missing', () => {
    const catalog: BillingPlanCatalogItem[] = [
      { name: 'pro', price: 49, users: 15, tasks: 5000 },
      { name: 'basic', price: 19, users: 5, tasks: 500 },
    ];
    expect(sortPlans(catalog).map((p) => p.name)).toEqual(['basic', 'pro']);
  });

  it('falls back to API rows when no PLAN_ORDER names match', () => {
    const catalog = [{ name: 'starter', price: 9, users: 2, tasks: 100 }] as unknown as BillingPlanCatalogItem[];
    const sorted = sortPlans(catalog);
    expect(sorted.length).toBe(1);
    expect((sorted[0] as { name: string }).name).toBe('starter');
  });
});

describe('shouldShowBillingFullSkeleton', () => {
  it('returns false when billing errored', () => {
    expect(
      shouldShowBillingFullSkeleton({
        billingData: undefined,
        billingIsError: true,
        billingIsPending: true,
        billingIsFetching: true,
      })
    ).toBe(false);
  });

  it('returns false when billing data exists', () => {
    expect(
      shouldShowBillingFullSkeleton({
        billingData: { plan: 'basic' },
        billingIsError: false,
        billingIsPending: false,
        billingIsFetching: false,
      })
    ).toBe(false);
  });

  it('returns true when no data yet and pending', () => {
    expect(
      shouldShowBillingFullSkeleton({
        billingData: undefined,
        billingIsError: false,
        billingIsPending: true,
        billingIsFetching: false,
      })
    ).toBe(true);
  });

  it('returns true when no data yet and fetching', () => {
    expect(
      shouldShowBillingFullSkeleton({
        billingData: undefined,
        billingIsError: false,
        billingIsPending: false,
        billingIsFetching: true,
      })
    ).toBe(true);
  });

  it('returns false when idle with no data and no error (e.g. disabled query)', () => {
    expect(
      shouldShowBillingFullSkeleton({
        billingData: undefined,
        billingIsError: false,
        billingIsPending: false,
        billingIsFetching: false,
      })
    ).toBe(false);
  });
});
