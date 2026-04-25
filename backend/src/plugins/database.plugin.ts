import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { env } from '../shared/utils/env.js';

/**
 * Registers a pg Pool on fastify.db.
 * The pool is gracefully closed on server shutdown.
 */
async function databasePlugin(app: FastifyInstance): Promise<void> {
  const databaseUrl = env.DATABASE_URL;
  const isLocalDatabase =
    databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30_000,
    // Avoid flaky startup/runtime 500s during short DB network hiccups.
    connectionTimeoutMillis: env.PG_CONNECTION_TIMEOUT_MS,
    keepAlive: true,
    ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
  });

  // Verify connectivity at startup, but don't crash the whole app in development
  // if the DB is temporarily unreachable. In production we rethrow so startup
  // fails fast.
  try {
    const client = await pool.connect();
    client.release();
    app.log.info('Database connection established');
  } catch (err) {
    app.log.error({ err }, 'Failed to connect to database at startup');
    if (env.NODE_ENV === 'production') {
      throw err;
    }
    app.log.warn('Continuing startup in development despite DB connection failure');
  }

  app.decorate('db', pool);

  app.addHook('onClose', async () => {
    await pool.end();
    app.log.info('Database pool closed');
  });
}

export default fastifyPlugin(databasePlugin, {
  name: 'database',
});
