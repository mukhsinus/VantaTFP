import { z } from 'zod';

if (!process.env.REDIS_URL?.trim()) {
  throw new Error('REDIS_URL is not defined');
}

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  DB_URL: z.string().optional(),
  BACKUP_PATH: z.string().default('backups'),
  REDIS_URL: z.string().min(1),
  BULLMQ_PREFIX: z.string().default('tfp'),
  PAYROLL_DEFAULT_BASE_SALARY: z.coerce.number().nonnegative().default(0),
  PAYROLL_DEFAULT_TASK_BONUS_RATE: z.coerce.number().nonnegative().default(0),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173,http://127.0.0.1:5173'),
  SENTRY_DSN: z.string().optional(),
  BILLING_STRICT_MODE: z.string().optional().default('true').transform((value) => value !== 'false'),
  BILLING_DEV_API_RATE_LIMIT: z.coerce.number().int().positive().default(10000),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  PG_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(): Environment {
  const result = environmentSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  return result.data;
}

export const env = parseEnvironment();
