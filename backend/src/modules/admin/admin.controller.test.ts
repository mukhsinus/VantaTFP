import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';

process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/tfp_test';
process.env.JWT_SECRET ??= 'test-secret-123456789012345678901234567890';

describe('admin routes audit propagation', () => {
  it('propagates actor userId from request auth context into tenant suspend audit log', async () => {
    const { adminRoutes } = await import('./admin.controller.js');
    const tenantId = 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4';
    const auditInserts: Array<{
      tenant_id: string;
      action: string;
      entity: string;
      user_id: string;
      metadata: Record<string, unknown>;
    }> = [];

    const db = {
      query: vi.fn(async (sql: string, params: unknown[] = []) => {
        if (
          sql.includes('SELECT id, name, slug, plan, is_active, created_at, updated_at') &&
          sql.includes('FROM tenants')
        ) {
          return {
            rows: [
              {
                id: tenantId,
                name: 'Acme LLC',
                slug: 'acme',
                plan: 'basic',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
            rowCount: 1,
          };
        }

        if (sql.includes('UPDATE tenants') && sql.includes('SET is_active = $2')) {
          return { rows: [], rowCount: 1 };
        }

        if (sql.includes('INSERT INTO audit_logs')) {
          auditInserts.push({
            tenant_id: String(params[0]),
            action: String(params[1]),
            entity: String(params[2]),
            user_id: String(params[3]),
            metadata: JSON.parse(String(params[4])) as Record<string, unknown>,
          });
          return { rows: [], rowCount: 1 };
        }

        throw new Error(`Unexpected SQL in test stub: ${sql}`);
      }),
    };

    const app = Fastify();
    app.decorate('db', db as never);
    app.decorate('authenticate', async (request: unknown) => {
      (request as { user: unknown }).user = {
        id: 'actor-1',
        userId: 'actor-1',
        system_role: 'super_admin',
        tenant_role: null,
        tenant_id: null,
        role: 'ADMIN',
      };
    });

    await app.register(adminRoutes, { prefix: '/api/v1/admin' });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/tenants/${tenantId}/suspend`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: { ok: true },
      error: null,
    });
    expect(auditInserts).toHaveLength(1);
    expect(auditInserts[0]).toEqual(
      expect.objectContaining({
        tenant_id: tenantId,
        action: 'TENANT_SUSPENDED',
        entity: 'TENANT',
        user_id: 'actor-1',
      })
    );

    await app.close();
  });
});
