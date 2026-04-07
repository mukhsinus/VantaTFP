import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { env } from '../utils/env.js';

function getRedisConnection() {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    db: url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : 0,
    maxRetriesPerRequest: null as null,
  };
}

const sharedConnection = getRedisConnection();

export function createQueue<T>(name: string): Queue<T> {
  return new Queue<T>(name, {
    connection: sharedConnection,
    prefix: env.BULLMQ_PREFIX,
    defaultJobOptions: {
      attempts: 3,
      removeOnComplete: 1000,
      removeOnFail: 5000,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  });
}

export function createWorker<T>(
  name: string,
  processor: (job: Job<T>) => Promise<void>
): Worker<T> {
  return new Worker<T>(name, processor, {
    connection: sharedConnection,
    prefix: env.BULLMQ_PREFIX,
    concurrency: 5,
  });
}

export function createQueueEvents(name: string): QueueEvents {
  return new QueueEvents(name, {
    connection: sharedConnection,
    prefix: env.BULLMQ_PREFIX,
  });
}
