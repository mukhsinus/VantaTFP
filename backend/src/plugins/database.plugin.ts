import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { env } from '../shared/utils/env.js';

/**
 * Registers a pg Pool on fastify.db.
 * The pool is gracefully closed on server shutdown.
 */
async function databasePlugin(app: FastifyInstance): Promise<void> {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // Verify connectivity at startup
  const client = await pool.connect();
  client.release();
  app.log.info('Database connection established');

  app.decorate('db', pool);

  app.addHook('onClose', async () => {
    await pool.end();
    app.log.info('Database pool closed');
  });
}

export default fastifyPlugin(databasePlugin, {
  name: 'database',
});
