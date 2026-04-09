import type { Pool } from 'pg';

export interface AuthSchemaCaps {
  tenantUsersTable: boolean;
  usersSystemRoleColumn: boolean;
}

let cached: AuthSchemaCaps | null = null;
let inflight: Promise<AuthSchemaCaps> | null = null;

/**
 * One-time introspection per process so auth queries work before/without full migrations.
 */
export function getAuthSchemaCaps(db: Pool): Promise<AuthSchemaCaps> {
  if (cached) {
    return Promise.resolve(cached);
  }
  if (!inflight) {
    inflight = (async () => {
      try {
        const r = await db.query<{ tu: boolean; sr: boolean }>(
          `
          SELECT
            to_regclass('public.tenant_users') IS NOT NULL AS tu,
            EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'users'
                AND column_name = 'system_role'
            ) AS sr
          `
        );
        cached = {
          tenantUsersTable: Boolean(r.rows[0]?.tu),
          usersSystemRoleColumn: Boolean(r.rows[0]?.sr),
        };
      } catch {
        cached = { tenantUsersTable: false, usersSystemRoleColumn: false };
      }
      return cached;
    })();
  }
  return inflight;
}
