require('dotenv').config();
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(2);
}

const migrationVersion = '20260417100000_optimize_indexes_concurrent';
const expectedIndexes = [
  'idx_tasks_tenant_status_created_at_desc',
  'idx_tasks_tenant_assignee_created_at_desc',
  'idx_payroll_tenant_employee_period_desc',
  'ux_tenant_invites_active_email_lower',
  'idx_tenant_invites_tenant_token_active',
];

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();

    const migRes = await client.query('SELECT version, name, checksum, applied_at FROM schema_migrations WHERE version = $1', [migrationVersion]);
    console.log(JSON.stringify({ migrationRow: migRes.rows }, null, 2));

    const idxRes = await client.query(
      `SELECT indexname, tablename FROM pg_indexes WHERE indexname = ANY($1)`,
      [expectedIndexes]
    );
    const found = idxRes.rows.map(r => r.indexname);
    console.log(JSON.stringify({ foundIndexes: found }, null, 2));

    const missing = expectedIndexes.filter(i => !found.includes(i));
    if (missing.length === 0) {
      console.log('All expected indexes present. Deleting migration row...');
      const del = await client.query('DELETE FROM schema_migrations WHERE version = $1 RETURNING *', [migrationVersion]);
      console.log(JSON.stringify({ deleted: del.rows }, null, 2));
      process.exit(0);
    } else {
      console.error('Missing indexes:', missing);
      process.exit(3);
    }
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    try { await client.end(); } catch {}
  }
})();
