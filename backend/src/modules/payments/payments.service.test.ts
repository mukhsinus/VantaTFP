import { describe, expect, it } from 'vitest';
import { PaymentsService } from './payments.service.js';
import type { PaymentsRepository } from './payments.repository.js';
import type { BillingService } from '../billing/billing.service.js';

describe('PaymentsService revenue path', () => {
  it('creates tenant payment request and confirms it by admin', async () => {
    const requests = new Map<
      string,
      {
        id: string;
        tenant_id: string;
        status: 'pending' | 'confirmed' | 'rejected';
        plan_name: string;
        amount: number;
      }
    >();

    const fakeBilling = {
      createUpgradePaymentRequest: async (
        tenantId: string,
        _userId: string,
        plan: 'basic' | 'pro' | 'business' | 'enterprise'
      ) => {
        const id = 'payment-1';
        requests.set(id, {
          id,
          tenant_id: tenantId,
          status: 'pending',
          plan_name: plan,
          amount: 10,
        });
        return { id };
      },
      approvePaymentRequest: async (id: string, _adminId: string) => {
        const row = requests.get(id);
        if (!row) throw new Error('missing request');
        row.status = 'confirmed';
      },
    } as unknown as BillingService;

    const fakeRepo = {
      findById: async (id: string, tenantId?: string) => {
        const row = requests.get(id);
        if (!row) return null;
        if (tenantId && row.tenant_id !== tenantId) return null;
        return {
          ...row,
          amount: String(row.amount),
        };
      },
      listByTenant: async (tenantId: string) =>
        [...requests.values()]
          .filter((r) => r.tenant_id === tenantId)
          .map((r) => ({ ...r, amount: String(r.amount) })),
      listPending: async () =>
        [...requests.values()]
          .filter((r) => r.status === 'pending')
          .map((r) => ({ ...r, amount: String(r.amount) })),
      reject: async (id: string) => {
        const row = requests.get(id);
        if (!row) throw new Error('missing request');
        row.status = 'rejected';
        return { ...row, amount: String(row.amount) };
      },
    } as unknown as PaymentsRepository;

    const service = new PaymentsService(fakeRepo, fakeBilling);

    const created = await service.createPaymentRequest('tenant-1', 'owner-1', { plan: 'pro' });
    expect(created.status).toBe('pending');

    const pendingBefore = await service.listPending();
    expect(pendingBefore).toHaveLength(1);

    const confirmed = await service.confirmPayment(created.id, 'super-admin-1');
    expect(confirmed.status).toBe('confirmed');

    const pendingAfter = await service.listPending();
    expect(pendingAfter).toHaveLength(0);
  });
});
