import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import { env } from '../shared/utils/env.js';

// In-memory store for auth endpoint rate limits
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

async function rateLimitPlugin(app: FastifyInstance): Promise<void> {
  // Global rate limit: 100 requests per 15 minutes per IP
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    cache: 10000,
    skipOnError: false,
  });

  // Helper to check auth endpoint rate limits
  const checkAuthRateLimit = (
    ip: string,
    endpoint: 'login' | 'register',
    maxAttempts: number,
    windowMs: number
  ): { allowed: boolean; remaining: number } => {
    const key = `${endpoint}:${ip}`;
    const now = Date.now();
    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;
    const allowed = entry.count <= maxAttempts;
    const remaining = Math.max(0, maxAttempts - entry.count);

    return { allowed, remaining };
  };

  // Register strict rate limiters for auth endpoints
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const isDevelopment = env.NODE_ENV === 'development';
    const loginMaxAttempts = isDevelopment ? 30 : 5;
    const loginWindowMs = isDevelopment ? 60 * 1000 : 15 * 60 * 1000;
    const loginWindowLabel = isDevelopment ? '1 minute' : '15 minutes';

    const isLoginEndpoint = request.url === '/api/v1/auth/login' && request.method === 'POST';
    const isRegisterEndpoint =
      request.url === '/api/v1/auth/register' && request.method === 'POST';

    if (isLoginEndpoint) {
      const { allowed } = checkAuthRateLimit(request.ip, 'login', loginMaxAttempts, loginWindowMs);
      if (!allowed) {
        return reply.code(429).send({
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Too many login attempts. Please try again in ${loginWindowLabel}.`,
        });
      }
    }

    if (isRegisterEndpoint) {
      // 3 attempts per hour per IP
      const { allowed } = checkAuthRateLimit(request.ip, 'register', 3, 60 * 60 * 1000);
      if (!allowed) {
        return reply.code(429).send({
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Too many registration attempts. Please try again in 1 hour.',
        });
      }
    }
  });
}

export default fastifyPlugin(rateLimitPlugin, { name: 'rate-limit' });
