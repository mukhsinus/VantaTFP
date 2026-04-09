import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { kpiApi } from '@entities/kpi/kpi.api';
import { kpiKeys } from './kpi.query-keys';
import type { Role } from '@shared/types/auth.types';

function currentMonthRange(): { periodStart: string; periodEnd: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
}

export function useKpiAnalytics(options?: { role?: Role | null; userId?: string; teamId?: string; enabled?: boolean }) {
  const range = useMemo(() => currentMonthRange(), []);
  const scope = options?.role ?? 'ADMIN';
  const scopedParams = {
    periodStart: range.periodStart,
    periodEnd: range.periodEnd,
    ...(scope === 'EMPLOYEE' && options?.userId ? { userId: options.userId } : {}),
    ...(scope === 'MANAGER' && options?.teamId ? { teamId: options.teamId } : {}),
  };
  const aggregated = useQuery({
    queryKey: [...kpiKeys.all, 'analytics', 'aggregated', scope, options?.userId ?? '', options?.teamId ?? '', range.periodStart, range.periodEnd],
    enabled: options?.enabled ?? true,
    queryFn: () =>
      kpiApi.analyticsAggregated(scopedParams),
  });

  const employees = useQuery({
    queryKey: [...kpiKeys.all, 'analytics', 'employees', scope, options?.userId ?? '', options?.teamId ?? '', range.periodStart, range.periodEnd],
    enabled: options?.enabled ?? true,
    queryFn: () =>
      kpiApi.analyticsByEmployee(scopedParams),
  });

  return { range, aggregated, employees };
}
