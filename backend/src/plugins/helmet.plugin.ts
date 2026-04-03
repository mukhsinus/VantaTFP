import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyHelmet from '@fastify/helmet';

async function helmetPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Adjust when serving static assets
  });
}

export default fastifyPlugin(helmetPlugin, { name: 'helmet' });
