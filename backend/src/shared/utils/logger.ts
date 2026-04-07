import pino from 'pino';
import type { FastifyServerOptions } from 'fastify';
import { env } from './env.js';

const isDevelopment = env.NODE_ENV !== 'production';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isDevelopment
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
});

export const fastifyLoggerOptions: FastifyServerOptions['logger'] = {
  level: env.LOG_LEVEL,
  transport: isDevelopment
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.refreshToken',
    ],
    remove: true,
  },
};
