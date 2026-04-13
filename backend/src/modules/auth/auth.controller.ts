import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { EmployeesRepository } from '../employees/employees.repository.js';
import { env } from '../../shared/utils/env.js';
import { sendSuccess } from '../../shared/utils/response.js';
import {
  loginRequestSchema,
  registerRequestSchema,
  registerEmployerSchema,
  refreshTokenRequestSchema,
} from './auth.schema.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const authRepository = new AuthRepository(app.db);
  const employeesRepository = new EmployeesRepository(app.db);
  const authService = new AuthService(
    authRepository,
    (payload, expiresIn) =>
      app.jwt.sign({ ...payload, tokenType: 'access' } as any, {
        expiresIn: expiresIn ?? env.JWT_EXPIRY,
      }),
    (payload, expiresIn) =>
      app.jwt.sign({ ...payload, tokenType: 'refresh' } as any, {
        expiresIn: expiresIn ?? env.JWT_REFRESH_EXPIRY,
      }),
    (token) => app.jwt.verify(token) as any,
    app.billing,
    employeesRepository
  );

  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginRequestSchema.parse(request.body);
    const tokens = await authService.login(body);
    return sendSuccess(reply, tokens);
  });

  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerRequestSchema.parse(request.body);
    const result = await authService.register(body);
    return sendSuccess(reply, result, 201);
  });

  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = refreshTokenRequestSchema.parse(request.body);
    const tokens = await authService.refreshTokens(body.refreshToken);
    return sendSuccess(reply, tokens);
  });

  /** Public employer self-registration — no auth required */
  app.post('/register-employer', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerEmployerSchema.parse(request.body);
    const result = await authService.registerEmployer(body);
    return sendSuccess(reply, result, 201);
  });
}
