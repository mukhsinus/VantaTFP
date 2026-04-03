import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import {
  loginRequestSchema,
  registerRequestSchema,
  refreshTokenRequestSchema,
} from './auth.schema.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const authRepository = new AuthRepository(app.db);
  const authService = new AuthService(
    authRepository,
    (payload, expiresIn) => app.jwt.sign(payload, { expiresIn })
  );

  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginRequestSchema.parse(request.body);
    const tokens = await authService.login(body);
    return reply.status(200).send(tokens);
  });

  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerRequestSchema.parse(request.body);
    const result = await authService.register(body);
    return reply.status(201).send(result);
  });

  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = refreshTokenRequestSchema.parse(request.body);
    const tokens = await authService.refreshTokens(body.refreshToken);
    return reply.status(200).send(tokens);
  });
}
