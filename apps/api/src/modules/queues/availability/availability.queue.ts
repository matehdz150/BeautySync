import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

export function createAvailabilityQueue(redis: Redis) {
  return new Queue('availability', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 5000,
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    },
  });
}
