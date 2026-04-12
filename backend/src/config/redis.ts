import Redis from 'ioredis';
import { env } from '../shared/utils/env.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
