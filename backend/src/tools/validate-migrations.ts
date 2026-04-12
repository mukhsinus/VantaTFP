import 'dotenv/config';
import { readdir, readFile } from 'fs/promises';
import { resolve } from 'path';
import { Client } from 'pg';

const MIGRATIONS_DIR = resolve(process.cwd(), 'db/migrations');

function parseMigrationFilename(file: string): { version: string; direction: 'up' | 'down' } | null {
  const match = file.match(/^([0-9]{14}_[a-z0-9_]+)\.(up|down)\.sql$/i);
  if (!match) return null;
  return { version: match[1], direction: match[2].toLowerCase() as 'up' | 'down' };
}

async function validatePairs(): Promise<Map<string, { up?: string; down?: string }>> {
  const files = await readdir(MIGRATIONS_DIR);
  const grouped = new Map<string, { up?: string; down?: string }>();
  for (const file of files) {
    const parsed = parseMigrationFilename(file);
    if (!parsed) continue;
    const current = grouped.get(parsed.version) ?? {};
    if (parsed.direction === 'up') current.up = resolve(MIGRATIONS_DIR, file);
    if (parsed.direction === 'down') current.down = resolve(MIGRATIONS_DIR, file);
    grouped.set(parsed.version, current);
  }

  const broken = [...grouped.entries()].filter(([, p]) => !p.up || !p.down);
  if (broken.length > 0) {
    throw new Error(
      `Missing migration pair files: ${broken.map(([version]) => version).join(', ')}`
    );
  }
  return grouped;
}

async function validateLatestRollbackExecution(
  client: Client,
  grouped: Map<string, { up?: string; down?: string }>
): Promise<void> {
  const applied = await client.query<{ version: string }>(
    'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
  );
  const latest = applied.rows[0]?.version;
  if (!latest) {
    return;
  }

  const pair = grouped.get(latest);
  if (!pair?.down) {
    throw new Error(`Missing .down.sql for latest applied migration ${latest}`);
  }

  const downSql = await readFile(pair.down, 'utf8');
  await client.query('BEGIN');
  try {
    await client.query(downSql);
  } finally {
    await client.query('ROLLBACK');
  }
}

async function run(): Promise<void> {
  const dbUrl = process.env.DB_URL ?? process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DB_URL or DATABASE_URL is required');
  }

  const grouped = await validatePairs();
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    );
    await validateLatestRollbackExecution(client, grouped);
  } finally {
    await client.end();
  }

  console.log('Migration validation passed: pairing + rollback execution check');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
