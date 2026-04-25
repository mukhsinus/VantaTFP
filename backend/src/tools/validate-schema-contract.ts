import 'dotenv/config';
import { Client } from 'pg';

type ColumnExpectation = {
  table: string;
  column: string;
};

const REQUIRED_TABLES = [
  'schema_migrations',
  'tasks',
  'subscriptions',
  'payment_requests',
  'refresh_token_sessions',
  'kpi_records',
  'payroll_records',
  'wallets',
  'transactions',
  'payouts',
];

const REQUIRED_COLUMNS: ColumnExpectation[] = [
  { table: 'tasks', column: 'tenant_id' },
  { table: 'tasks', column: 'is_deleted' },
  { table: 'refresh_token_sessions', column: 'token_hash' },
  { table: 'transactions', column: 'idempotency_key' },
  { table: 'payouts', column: 'idempotency_key' },
];

async function run(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL ?? process.env.DB_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL (or DB_URL) is required for schema contract validation.');
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    const tableResult = await client.query<{ table_name: string }>(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      `
    );
    const existingTables = new Set(tableResult.rows.map((r) => r.table_name));
    const missingTables = REQUIRED_TABLES.filter((table) => !existingTables.has(table));
    if (missingTables.length > 0) {
      throw new Error(`Schema contract failed: missing tables ${missingTables.join(', ')}`);
    }

    for (const expectation of REQUIRED_COLUMNS) {
      const result = await client.query<{ ok: boolean }>(
        `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = $2
        ) AS ok
        `,
        [expectation.table, expectation.column]
      );

      if (!result.rows[0]?.ok) {
        throw new Error(
          `Schema contract failed: missing column ${expectation.table}.${expectation.column}`
        );
      }
    }
  } finally {
    await client.end();
  }

  console.log('Schema contract validation passed');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
