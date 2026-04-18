import Redis from 'ioredis';
import { env } from '../shared/utils/env.js';

// Use lazyConnect to avoid attempting to connect to Redis at module import time.
// This prevents startup blocking/timeouts when the configured Redis is unreachable
// in local development. Consumers should call `redis.connect()` or rely on
// downstream libraries to trigger connection when needed.
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});
