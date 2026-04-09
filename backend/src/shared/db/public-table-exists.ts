import type { Pool } from 'pg';

const cache = new Map<string, boolean>();
const inflight = new Map<string, Promise<boolean>>();

/**
 * Cached `information_schema` lookup so API handlers can degrade gracefully when migrations
 * have not been applied (missing tables).
 */
export async function getPublicTableExists(db: Pool, tableName: string): Promise<boolean> {
  if (cache.has(tableName)) {
    return cache.get(tableName)!;
  }
  let p = inflight.get(tableName);
  if (!p) {
    p = (async () => {
      try {
        const r = await db.query<{ ok: boolean }>(
          `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = $1
          ) AS ok
          `,
          [tableName]
        );
        const ok = Boolean(r.rows[0]?.ok);
        cache.set(tableName, ok);
        return ok;
      } catch {
        cache.set(tableName, false);
        return false;
      } finally {
        inflight.delete(tableName);
      }
    })();
    inflight.set(tableName, p);
  }
  return p;
}
