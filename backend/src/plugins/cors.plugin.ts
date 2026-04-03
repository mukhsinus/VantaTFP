import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import { env } from '../shared/utils/env.js';

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function parseAllowedOrigins(raw: string): Set<string> {
  return new Set(
    raw
      .split(',')
      .map((value) => normalizeOrigin(value))
      .filter(Boolean)
  );
}

async function corsPlugin(app: FastifyInstance): Promise<void> {
  const allowedOrigins = parseAllowedOrigins(env.CORS_ORIGIN);

  await app.register(fastifyCors, {
    origin: (origin, callback) => {
      // Non-browser clients (curl/postman/server-to-server) may not send Origin.
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);
      const isAllowed = allowedOrigins.has(normalizedOrigin);

      callback(null, isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
}

export default fastifyPlugin(corsPlugin, { name: 'cors' });
