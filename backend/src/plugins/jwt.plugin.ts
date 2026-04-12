import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { env } from '../shared/utils/env.js';
import { authenticateMiddleware } from '../shared/middleware/authenticate.middleware.js';

async function jwtPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRY },
  });

  // Expose authenticate as a Fastify decorator so any route can reference it
  app.decorate('authenticate', authenticateMiddleware);
}

export default fastifyPlugin(jwtPlugin, {
  name: 'jwt',
  dependencies: ['database', 'billing'],
});
