#!/usr/bin/env node
require('dotenv/config');
const { Client } = require('pg');

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set in environment.');
    process.exit(2);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const tRes = await client.query('SELECT id FROM tenants LIMIT 1');
    if (!tRes.rows.length) {
      console.error('No tenant found in database to run EXPLAIN against.');
      process.exit(3);
    }
    const tenantId = tRes.rows[0].id;
    console.log('Using tenant id:', tenantId);

    // Try to find an assignee (user) in that tenant
    const uRes = await client.query('SELECT id FROM users WHERE tenant_id = $1 LIMIT 1', [tenantId]);
    const assigneeId = uRes.rows[0]?.id ?? null;
    if (assigneeId) console.log('Found assignee id for tests:', assigneeId);

    const queries = [
      {
        name: 'List tasks (no filters)',
        sql: `EXPLAIN ANALYZE
        SELECT id, tenant_id, title, assignee_id, status, created_at
        FROM tasks
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT 20 OFFSET 0;`,
        params: [tenantId],
      },
      {
        name: 'List tasks (status filter)',
        sql: `EXPLAIN ANALYZE
        SELECT id, tenant_id, title, assignee_id, status, created_at
        FROM tasks
        WHERE tenant_id = $1 AND status = $2
        ORDER BY created_at DESC
        LIMIT 20 OFFSET 0;`,
        params: [tenantId, 'TODO'],
      },
    ];

    if (assigneeId) {
      queries.push({
        name: 'List tasks (assignee filter)',
        sql: `EXPLAIN ANALYZE
        SELECT id, tenant_id, title, assignee_id, status, created_at
        FROM tasks
        WHERE tenant_id = $1 AND assignee_id = $2
        ORDER BY created_at DESC
        LIMIT 20 OFFSET 0;`,
        params: [tenantId, assigneeId],
      });
    }

    for (const q of queries) {
      console.log('\n---', q.name, '---');
      const res = await client.query(q.sql, q.params);
      // PostgreSQL returns rows as objects with single text column per plan line
      for (const row of res.rows) {
        const first = Object.values(row)[0];
        console.log(first);
      }
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('Error running explain script:', err);
  process.exit(1);
});
