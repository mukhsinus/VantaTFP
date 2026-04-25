import { describe, expect, it } from 'vitest';
import type { KpiRepository } from './kpi.repository.js';

describe('KpiService deterministic aggregation', () => {
  it('aggregates cached KPI rows deterministically', async () => {
    process.env.REDIS_URL ??= 'redis://localhost:6379';
    process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/tfp_test';
    process.env.JWT_SECRET ??= 'test-secret-123456789012345678901234567890';
    const { KpiService } = await import('./kpi.service.js');
    const repo = {
      resolveAnalyticsAssigneeIds: async () => ['u1', 'u2'],
      hasKpiRecordsTable: async () => true,
      findKpiRecordsForUsersAndPeriod: async () => [
        {
          tenant_id: 'tenant-1',
          user_id: 'u1',
          period_start: new Date('2026-04-01T00:00:00.000Z'),
          period_end: new Date('2026-04-30T23:59:59.000Z'),
          tasks_completed: 10,
          tasks_on_time: 8,
          tasks_overdue: 2,
          score: 80,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tenant_id: 'tenant-1',
          user_id: 'u2',
          period_start: new Date('2026-04-01T00:00:00.000Z'),
          period_end: new Date('2026-04-30T23:59:59.000Z'),
          tasks_completed: 5,
          tasks_on_time: 3,
          tasks_overdue: 2,
          score: 60,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      isDirectReport: async () => true,
    } as unknown as KpiRepository;

    const service = new KpiService(repo);
    const result = await service.getAnalyticsAggregated(
      'tenant-1',
      {
        periodStart: '2026-04-01T00:00:00.000Z',
        periodEnd: '2026-04-30T23:59:59.000Z',
        refresh: false,
      },
      { userId: 'owner-1', tenantRole: 'owner', systemRole: 'user' }
    );

    expect(result.completedTasks).toBe(15);
    expect(result.onTimeCompletedTasks).toBe(11);
    expect(result.overdueCompletedTasks).toBe(4);
    expect(result.performancePercent).toBe(73.33);
    expect(result.fromCache).toBe(true);
  });
});

describe('KpiService manager scope guards', () => {
  it('rejects manager access to non-direct-report user analytics', async () => {
    process.env.REDIS_URL ??= 'redis://localhost:6379';
    process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/tfp_test';
    process.env.JWT_SECRET ??= 'test-secret-123456789012345678901234567890';
    const { KpiService } = await import('./kpi.service.js');
    const repo = {
      isDirectReport: async () => false,
      resolveAnalyticsAssigneeIds: async () => [],
    } as unknown as KpiRepository;

    const service = new KpiService(repo);

    await expect(
      service.getAnalyticsByEmployee(
        'tenant-1',
        {
          periodStart: '2026-04-01T00:00:00.000Z',
          periodEnd: '2026-04-30T23:59:59.000Z',
          userId: 'employee-2',
          refresh: false,
        },
        { userId: 'manager-1', tenantRole: 'manager', systemRole: 'user' }
      )
    ).rejects.toThrow('You can only view analytics for your direct reports');
  });
});
