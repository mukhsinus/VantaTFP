import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import { env } from '../shared/utils/env.js';

async function corsPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyCors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
}

export default fastifyPlugin(corsPlugin, { name: 'cors' });
