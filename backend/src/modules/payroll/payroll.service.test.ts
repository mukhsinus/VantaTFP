import { describe, expect, it } from 'vitest';
import type { PayrollRepository } from './payroll.repository.js';

describe('PayrollService deterministic calculations', () => {
  it('applies kpi_based payroll rule deterministically', async () => {
    process.env.REDIS_URL ??= 'redis://localhost:6379';
    process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/tfp_test';
    process.env.JWT_SECRET ??= 'test-secret-123456789012345678901234567890';
    const { PayrollService } = await import('./payroll.service.js');
    const history: unknown[] = [];

    const repo = {
      findPayrollRuleByIdAndTenant: async () => ({
        id: 'rule-1',
        tenant_id: 'tenant-1',
        name: 'KPI rule',
        type: 'kpi_based',
        config: {
          baseSalary: 1000,
        },
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }),
      isActiveUserInTenant: async () => true,
      findKpiCacheForPeriod: async () => ({
        tenant_id: 'tenant-1',
        user_id: 'user-1',
        period_start: new Date('2026-04-01T00:00:00.000Z'),
        period_end: new Date('2026-04-30T23:59:59.000Z'),
        tasks_completed: 10,
        tasks_on_time: 8,
        tasks_overdue: 2,
        score: 80,
        created_at: new Date(),
        updated_at: new Date(),
      }),
      insertPayrollRecordHistory: async (payload: unknown) => {
        history.push(payload);
      },
      upsertPayment: async () => ({
        base: 1000,
        bonus: 800,
        total: 1800,
      }),
    } as unknown as PayrollRepository;

    const service = new PayrollService(repo);
    const result = await service.applyPayrollRule(
      'rule-1',
      'tenant-1',
      'user-1',
      '2026-04-01T00:00:00.000Z',
      '2026-04-30T23:59:59.000Z'
    );

    expect(result.amount).toBe(1800);
    expect(result.payment.base).toBe(1000);
    expect(result.payment.bonus).toBe(800);
    expect(result.payment.total).toBe(1800);
    expect(history).toHaveLength(1);
  });
});
