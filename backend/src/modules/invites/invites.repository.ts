import type { Pool, PoolClient } from 'pg';

export type InviteTenantRole = 'manager' | 'employee';

export interface InviteRecord {
  id: string;
  token: string;
  tenant_id: string;
  role: InviteTenantRole;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

type Queryable = Pick<Pool, 'query'> | PoolClient;

export class InvitesRepository {
  constructor(private readonly db: Pool) {}

  async insertInvite(
    params: {
      token: string;
      tenant_id: string;
      role: InviteTenantRole;
      expires_at: Date;
    },
    executor: Queryable = this.db
  ): Promise<void> {
    await executor.query(
      `
      INSERT INTO invites (token, tenant_id, role, expires_at)
      VALUES ($1::uuid, $2::uuid, $3::tenant_membership_role, $4)
      `,
      [params.token, params.tenant_id, params.role, params.expires_at]
    );
  }

  /** Resolve tenant for routing into billing tx (token must exist). */
  async findTenantIdByToken(token: string, executor: Queryable = this.db): Promise<string | null> {
    const result = await executor.query<{ tenant_id: string }>(
      `
      SELECT tenant_id::text AS tenant_id
      FROM invites
      WHERE token = $1::uuid
      LIMIT 1
      `,
      [token]
    );
    return result.rows[0]?.tenant_id ?? null;
  }

  /**
   * Lock a usable invite for acceptance (call inside an existing transaction).
   */
  async lockValidInviteByToken(
    token: string,
    executor: Queryable
  ): Promise<InviteRecord | null> {
    const result = await executor.query<InviteRecord>(
      `
      SELECT id, token::text, tenant_id, role::text AS role, expires_at, used_at, created_at
      FROM invites
      WHERE token = $1::uuid
        AND used_at IS NULL
        AND expires_at > NOW()
      FOR UPDATE
      LIMIT 1
      `,
      [token]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...row,
      role: row.role as InviteTenantRole,
    };
  }

  async markUsed(inviteId: string, executor: Queryable = this.db): Promise<void> {
    await executor.query(
      `
      UPDATE invites
      SET used_at = NOW()
      WHERE id = $1::uuid AND used_at IS NULL
      `,
      [inviteId]
    );
  }
}
