import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AuthService } from './auth.service.js';
import type { AuthRepository } from './auth.repository.js';
import type { BillingService } from '../billing/billing.service.js';
import type { EmployeesRepository } from '../employees/employees.repository.js';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function expiresAtFromDuration(duration: string): number {
  const now = Math.floor(Date.now() / 1000);
  if (duration.endsWith('m')) return now + Number(duration.slice(0, -1)) * 60;
  if (duration.endsWith('h')) return now + Number(duration.slice(0, -1)) * 60 * 60;
  if (duration.endsWith('d')) return now + Number(duration.slice(0, -1)) * 60 * 60 * 24;
  return now + 60 * 60;
}

function signToken(payload: object, expiresIn: string): string {
  const body = { ...payload, exp: expiresAtFromDuration(expiresIn) };
  return Buffer.from(JSON.stringify(body)).toString('base64url');
}

function verifyToken(token: string): Record<string, unknown> {
  const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as {
    exp?: number;
  };
  if (!decoded.exp || decoded.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('expired token');
  }
  return decoded;
}

describe('AuthService refresh/revoke flow', () => {
  it('rotates refresh token session and revokes the old token', async () => {
    const sessions = new Map<
      string,
      {
        userId: string;
        revokedAt: Date | null;
        replacedBy: string | null;
      }
    >();

    const fakeRepo = {
      findActiveUserById: async () => ({ id: 'user-1' }),
      findActiveRefreshTokenSession: async (tokenHash: string) => {
        const row = sessions.get(tokenHash);
        if (!row || row.revokedAt) return null;
        return {
          id: 'session-1',
          user_id: row.userId,
          tenant_id: 'tenant-1',
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + 60_000),
          revoked_at: row.revokedAt,
          replaced_by_token_hash: row.replacedBy,
          created_at: new Date(),
          last_used_at: null,
        };
      },
      findAuthContextById: async () => ({
        id: 'user-1',
        email: 'owner@tenant.com',
        system_role: 'user',
        legacy_role: 'ADMIN',
        user_primary_tenant_id: 'tenant-1',
        effective_tenant_id: 'tenant-1',
        membership_role: 'owner',
        tenant_plan: 'basic',
      }),
      withTransaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
      revokeRefreshTokenSession: async (tokenHash: string, replacedBy: string | null) => {
        const row = sessions.get(tokenHash);
        if (!row) return;
        row.revokedAt = new Date();
        row.replacedBy = replacedBy;
      },
      createRefreshTokenSession: async (data: {
        userId: string;
        tokenHash: string;
      }) => {
        sessions.set(data.tokenHash, {
          userId: data.userId,
          revokedAt: null,
          replacedBy: null,
        });
      },
    } as unknown as AuthRepository;

    const service = new AuthService(
      fakeRepo,
      (payload, expiresIn) => signToken(payload, expiresIn),
      (payload, expiresIn) => signToken(payload, expiresIn),
      (token) => verifyToken(token) as never,
      {} as BillingService,
      {} as EmployeesRepository
    );

    const initialRefreshToken = signToken(
      {
        userId: 'user-1',
        tenantId: 'tenant-1',
        tokenType: 'refresh',
      },
      '7d'
    );
    const initialHash = sha256(initialRefreshToken);
    sessions.set(initialHash, { userId: 'user-1', revokedAt: null, replacedBy: null });

    const next = await service.refreshTokens(initialRefreshToken);
    const nextHash = sha256(next.refreshToken);

    expect(next.refreshToken).not.toBe(initialRefreshToken);
    expect(sessions.get(initialHash)?.revokedAt).toBeTruthy();
    expect(sessions.get(initialHash)?.replacedBy).toBe(nextHash);
    expect(sessions.get(nextHash)?.revokedAt).toBeNull();
  });

  it('revokeRefreshToken is idempotent and safe', async () => {
    const sessions = new Map<string, { revokedAt: Date | null }>();
    const fakeRepo = {
      revokeRefreshTokenSession: async (tokenHash: string) => {
        const row = sessions.get(tokenHash);
        if (!row) return;
        row.revokedAt = new Date();
      },
    } as unknown as AuthRepository;

    const service = new AuthService(
      fakeRepo,
      (payload, expiresIn) => signToken(payload, expiresIn),
      (payload, expiresIn) => signToken(payload, expiresIn),
      (token) => verifyToken(token) as never,
      {} as BillingService,
      {} as EmployeesRepository
    );

    const refreshToken = signToken(
      { userId: 'user-1', tenantId: 'tenant-1', tokenType: 'refresh' },
      '7d'
    );
    sessions.set(sha256(refreshToken), { revokedAt: null });

    await service.revokeRefreshToken(refreshToken, 'user-1');
    await service.revokeRefreshToken(refreshToken, 'user-1');

    expect(sessions.get(sha256(refreshToken))?.revokedAt).toBeTruthy();
  });
});
