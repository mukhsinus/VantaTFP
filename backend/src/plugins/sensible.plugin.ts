import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifySensible from '@fastify/sensible';

async function sensiblePlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifySensible);
}

export default fastifyPlugin(sensiblePlugin, { name: 'sensible' });
