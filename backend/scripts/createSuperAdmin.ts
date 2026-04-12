/**
 * Creates or upgrades a platform super_admin user (no tenant, no tenant_users, no subscription).
 *
 * Env (optional overrides):
 *   SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, DB_URL or DATABASE_URL
 *
 * Requires migration `20260410120000_system_tenant_roles` (users.system_role, nullable tenant_id).
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import pg from 'pg';

const DEFAULT_EMAIL = 'kamolovmuhsin@icloud.com';
const DEFAULT_PASSWORD = 'kamolovmuhsin@icloud.com';
const BCRYPT_ROUNDS = 12;

async function columnExists(
  client: pg.PoolClient,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const r = await client.query<{ ok: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    ) AS ok
    `,
    [tableName, columnName]
  );
  return Boolean(r.rows[0]?.ok);
}

async function tableExists(client: pg.PoolClient, tableName: string): Promise<boolean> {
  const r = await client.query<{ ok: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS ok
    `,
    [tableName]
  );
  return Boolean(r.rows[0]?.ok);
}

function namesFromEmail(email: string): [string, string] {
  const local = email.split('@')[0] ?? 'admin';
  const cleaned = local.replace(/[^a-zA-Z0-9._-]/g, '').replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return ['Super', 'Admin'];
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const cap = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
  return [cap(parts[0] ?? 'Super'), cap(parts.slice(1).join(' ') || 'Admin')];
}

async function run(): Promise<void> {
  const dbUrl = process.env.DB_URL ?? process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('Set DB_URL or DATABASE_URL (same as the API server).');
  }

  const email = (process.env.SUPER_ADMIN_EMAIL ?? DEFAULT_EMAIL).trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD ?? DEFAULT_PASSWORD;

  const pool = new pg.Pool({ connectionString: dbUrl });
  const client = await pool.connect();

  try {
    if (!(await columnExists(client, 'users', 'system_role'))) {
      throw new Error(
        'Column users.system_role is missing. Run database migrations first (e.g. npm run migrate:up).'
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [firstName, lastName] = namesFromEmail(email);

    const existing = await client.query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );

    if (existing.rows[0]) {
      const userId = existing.rows[0].id;
      if (await tableExists(client, 'tenant_users')) {
        await client.query(`DELETE FROM tenant_users WHERE user_id = $1`, [userId]);
      }

      await client.query(
        `
        UPDATE users
        SET
          tenant_id = NULL,
          system_role = 'super_admin'::user_system_role,
          role = 'ADMIN',
          is_active = TRUE,
          password_hash = $1,
          first_name = COALESCE(NULLIF(TRIM(first_name), ''), $3),
          last_name = COALESCE(NULLIF(TRIM(last_name), ''), $4),
          updated_at = NOW()
        WHERE id = $2
        `,
        [passwordHash, userId, firstName, lastName]
      );

      console.log(`Upgraded existing user to super_admin: ${email} (id=${userId})`);
    } else {
      const ins = await client.query<{ id: string }>(
        `
        INSERT INTO users (
          tenant_id,
          email,
          password_hash,
          first_name,
          last_name,
          role,
          is_active,
          system_role,
          created_at,
          updated_at
        )
        VALUES (
          NULL,
          $1,
          $2,
          $3,
          $4,
          'ADMIN',
          TRUE,
          'super_admin'::user_system_role,
          NOW(),
          NOW()
        )
        RETURNING id
        `,
        [email, passwordHash, firstName, lastName]
      );
      const id = ins.rows[0]?.id;
      console.log(`Created super_admin: ${email} (id=${id})`);
    }

    console.log('Done. No tenant_users row and no subscription are required for this user.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
