import { describe, expect, it } from 'vitest';
import {
  adminDashboardQuerySchema,
  adminListQuerySchema,
  adminTenantScopeQuerySchema,
} from './admin.schema.js';

describe('admin schema tenant scope contract', () => {
  it('accepts optional tenant scope for list queries', () => {
    const parsed = adminListQuerySchema.parse({
      page: '2',
      limit: '15',
      tenantId: 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4',
    });
    expect(parsed).toEqual({
      page: 2,
      limit: 15,
      tenantId: 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4',
    });
  });

  it('rejects invalid tenantId format for scoped queries', () => {
    expect(() =>
      adminDashboardQuerySchema.parse({
        tenantId: 'not-a-uuid',
      })
    ).toThrow();
  });

  it('requires tenantId for strict tenant-scope endpoints', () => {
    expect(() => adminTenantScopeQuerySchema.parse({})).toThrow();
  });
});
