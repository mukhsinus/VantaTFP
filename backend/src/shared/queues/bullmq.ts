import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { redis } from '../../config/redis.js';
import { env } from '../utils/env.js';

export function createQueue<T>(name: string): Queue<T> {
  return new Queue<T>(name, {
    connection: redis,
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
    connection: redis,
    prefix: env.BULLMQ_PREFIX,
    concurrency: 5,
  });
}

export function createQueueEvents(name: string): QueueEvents {
  return new QueueEvents(name, {
    connection: redis,
    prefix: env.BULLMQ_PREFIX,
  });
}
