import 'dotenv/config';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { Client } from 'pg';
import pino from 'pino';

type Command = 'up' | 'down' | 'status';

interface Migration {
  version: string;
  name: string;
  upPath: string;
  downPath: string;
  upSql: string;
  downSql: string;
  checksum: string;
}

interface AppliedMigration {
  version: string;
  name: string;
  checksum: string;
  applied_at: string;
}

const MIGRATIONS_DIR = resolve(process.cwd(), 'db/migrations');
const MIGRATION_LOCK_KEY = 'tfp_schema_migrations_lock_v1';
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

async function ensureMigrationsTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function acquireLock(client: Client): Promise<void> {
  await client.query('SELECT pg_advisory_lock(hashtext($1));', [MIGRATION_LOCK_KEY]);
}

async function releaseLock(client: Client): Promise<void> {
  await client.query('SELECT pg_advisory_unlock(hashtext($1));', [MIGRATION_LOCK_KEY]);
}

function parseStepsArg(): number {
  const index = process.argv.findIndex((arg) => arg === '--steps');
  if (index === -1) return 1;

  const value = process.argv[index + 1];
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Invalid --steps value. Use a positive integer.');
  }

  return parsed;
}

function getCommand(): Command {
  const command = process.argv[2];
  if (command === 'up' || command === 'down' || command === 'status') {
    return command;
  }

  throw new Error('Usage: npm run migrate:up | migrate:down -- --steps <n> | migrate:status');
}

function parseMigrationFilename(file: string): { version: string; direction: 'up' | 'down' } | null {
  const match = file.match(/^([0-9]{14}_[a-z0-9_]+)\.(up|down)\.sql$/i);
  if (!match) return null;
  return {
    version: match[1],
    direction: match[2].toLowerCase() as 'up' | 'down',
  };
}

function checksum(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

async function loadMigrations(): Promise<Migration[]> {
  const files = await fs.readdir(MIGRATIONS_DIR);
  const grouped = new Map<string, { upPath?: string; downPath?: string }>();

  for (const file of files) {
    const parsed = parseMigrationFilename(file);
    if (!parsed) continue;

    const current = grouped.get(parsed.version) ?? {};
    const absolutePath = resolve(MIGRATIONS_DIR, file);
    if (parsed.direction === 'up') current.upPath = absolutePath;
    if (parsed.direction === 'down') current.downPath = absolutePath;
    grouped.set(parsed.version, current);
  }

  const migrations: Migration[] = [];
  const orderedVersions = [...grouped.keys()].sort((a, b) => a.localeCompare(b));

  for (const version of orderedVersions) {
    const pair = grouped.get(version);
    if (!pair?.upPath || !pair?.downPath) {
      throw new Error(`Migration ${version} must have both .up.sql and .down.sql files.`);
    }

    const upSql = await fs.readFile(pair.upPath, 'utf8');
    const downSql = await fs.readFile(pair.downPath, 'utf8');

    migrations.push({
      version,
      name: version.replace(/^[0-9]{14}_/, ''),
      upPath: pair.upPath,
      downPath: pair.downPath,
      upSql,
      downSql,
      checksum: checksum(upSql),
    });
  }

  return migrations;
}

async function getAppliedMigrations(client: Client): Promise<AppliedMigration[]> {
  const result = await client.query<AppliedMigration>(
    `SELECT version, name, checksum, applied_at
     FROM schema_migrations
     ORDER BY version ASC;`
  );
  return result.rows;
}

function assertChecksums(applied: AppliedMigration[], migrations: Migration[]): void {
  const byVersion = new Map(migrations.map((m) => [m.version, m]));
  for (const row of applied) {
    const local = byVersion.get(row.version);
    if (!local) continue;
    if (local.checksum !== row.checksum) {
      throw new Error(
        `Checksum mismatch for ${row.version}. Applied checksum differs from local migration file.`
      );
    }
  }
}

async function applyUp(client: Client, migrations: Migration[], applied: AppliedMigration[]): Promise<void> {
  const appliedVersions = new Set(applied.map((row) => row.version));
  const pending = migrations.filter((migration) => !appliedVersions.has(migration.version));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const migration of pending) {
    console.log(`Applying ${migration.version}...`);
    try {
      // Some migrations include statements with CONCURRENTLY which cannot
      // run inside a transaction. We must execute statements sequentially
      // and run non-CONCURRENTLY statements inside a transaction, while
      // executing CONCURRENTLY statements outside any transaction.
      const statements = migration.upSql
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      let pendingNonConcurrent: string[] = [];

      const flushNonConcurrent = async () => {
        if (pendingNonConcurrent.length === 0) return;
        await client.query('BEGIN;');
        try {
          for (const stmt of pendingNonConcurrent) {
            await client.query(stmt);
          }
          await client.query(
            `INSERT INTO schema_migrations (version, name, checksum)
             VALUES ($1, $2, $3)
             ON CONFLICT (version) DO NOTHING;`,
            [migration.version, migration.name, migration.checksum]
          );
          await client.query('COMMIT;');
        } catch (err) {
          try {
            await client.query('ROLLBACK;');
          } catch {}
          throw err;
        } finally {
          pendingNonConcurrent = [];
        }
      };

      for (const stmt of statements) {
        if (/CONCURRENTLY/i.test(stmt)) {
          // Flush any pending non-concurrent statements first
          await flushNonConcurrent();
          // Execute the concurrent statement outside any transaction
          await client.query(stmt);
        } else {
          // Queue non-concurrent statements to run inside a single transaction
          pendingNonConcurrent.push(stmt);
        }
      }

      // Flush remaining non-concurrent statements and record migration
      await flushNonConcurrent();
      console.log(`Applied ${migration.version}`);
    } catch (error) {
      try {
        await client.query('ROLLBACK;');
      } catch {
        // ignore rollback errors (may occur if no transaction active)
      }
      throw error;
    }
  }
}

async function applyDown(
  client: Client,
  migrations: Migration[],
  applied: AppliedMigration[],
  steps: number
): Promise<void> {
  if (applied.length === 0) {
    console.log('No applied migrations to roll back.');
    return;
  }

  const byVersion = new Map(migrations.map((migration) => [migration.version, migration]));
  const appliedDesc = [...applied].sort((a, b) => b.version.localeCompare(a.version));
  const targets = appliedDesc.slice(0, steps);

  for (const target of targets) {
    const migration = byVersion.get(target.version);
    if (!migration) {
      throw new Error(`Cannot roll back ${target.version}: local .down.sql file not found.`);
    }

    console.log(`Rolling back ${migration.version}...`);
    try {
      const statements = migration.downSql
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      let pendingNonConcurrent: string[] = [];

      const flushNonConcurrent = async () => {
        if (pendingNonConcurrent.length === 0) return;
        await client.query('BEGIN;');
        try {
          for (const stmt of pendingNonConcurrent) {
            await client.query(stmt);
          }
          await client.query('COMMIT;');
        } catch (err) {
          try {
            await client.query('ROLLBACK;');
          } catch {}
          throw err;
        } finally {
          pendingNonConcurrent = [];
        }
      };

      for (const stmt of statements) {
        if (/CONCURRENTLY/i.test(stmt)) {
          await flushNonConcurrent();
          await client.query(stmt);
        } else {
          pendingNonConcurrent.push(stmt);
        }
      }

      await flushNonConcurrent();

      // Record rollback by deleting migration record inside a transaction
      await client.query('BEGIN;');
      await client.query('DELETE FROM schema_migrations WHERE version = $1;', [migration.version]);
      await client.query('COMMIT;');

      console.log(`Rolled back ${migration.version}`);
    } catch (error) {
      try {
        await client.query('ROLLBACK;');
      } catch {
        // ignore rollback errors
      }
      throw error;
    }
  }
}

function printStatus(migrations: Migration[], applied: AppliedMigration[]): void {
  const appliedByVersion = new Map(applied.map((row) => [row.version, row]));
  const rows = migrations.map((migration) => {
    const row = appliedByVersion.get(migration.version);
    return {
      version: migration.version,
      name: migration.name,
      status: row ? 'APPLIED' : 'PENDING',
      appliedAt: row?.applied_at ?? '-',
    };
  });

  console.table(rows);
}

async function main(): Promise<void> {
  const command = getCommand();
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run migrations.');
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    await ensureMigrationsTable(client);
    await acquireLock(client);

    const migrations = await loadMigrations();
    const applied = await getAppliedMigrations(client);
    assertChecksums(applied, migrations);

    if (command === 'status') {
      printStatus(migrations, applied);
      return;
    }

    if (command === 'up') {
      await applyUp(client, migrations, applied);
      return;
    }

    const steps = parseStepsArg();
    await applyDown(client, migrations, applied, steps);
  } finally {
    try {
      await releaseLock(client);
    } catch {
      // no-op: lock release best effort
    }
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error({ err: error }, `Migration failed: ${message}`);
  process.exit(1);
});
