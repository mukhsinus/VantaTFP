import type { Pool } from 'pg';

export interface AuthSchemaCaps {
  tenantUsersTable: boolean;
  usersSystemRoleColumn: boolean;
  usersPhoneColumn: boolean;
}

/** Re-introspect periodically so runtime DDL (e.g. adding `users.phone`) is picked up without restarts. */
const CAPS_TTL_MS = 30_000;

let cached: { caps: AuthSchemaCaps; at: number } | null = null;
let inflight: Promise<AuthSchemaCaps> | null = null;

/**
 * Introspects public schema capabilities. Cached with TTL — not forever — so migrations
 * applied while the server is running are reflected.
 */
export function getAuthSchemaCaps(db: Pool): Promise<AuthSchemaCaps> {
  const now = Date.now();
  if (cached && now - cached.at < CAPS_TTL_MS) {
    return Promise.resolve(cached.caps);
  }

  if (inflight) {
    return inflight;
  }

  inflight = (async (): Promise<AuthSchemaCaps> => {
    try {
      const r = await db.query<{ tu: boolean; sr: boolean; ph: boolean }>(
        `
        SELECT
          to_regclass('public.tenant_users') IS NOT NULL AS tu,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'system_role'
          ) AS sr,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'phone'
          ) AS ph
        `
      );
      const caps: AuthSchemaCaps = {
        tenantUsersTable: Boolean(r.rows[0]?.tu),
        usersSystemRoleColumn: Boolean(r.rows[0]?.sr),
        usersPhoneColumn: Boolean(r.rows[0]?.ph),
      };
      cached = { caps, at: Date.now() };
      return caps;
    } catch {
      // Do not poison long-lived cache on transient errors.
      return {
        tenantUsersTable: false,
        usersSystemRoleColumn: false,
        usersPhoneColumn: false,
      };
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Clears caps cache (e.g. after applying migrations in the same process). */
export function invalidateAuthSchemaCaps(): void {
  cached = null;
  inflight = null;
}
