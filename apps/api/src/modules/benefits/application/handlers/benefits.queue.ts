import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

export function createBenefitsQueue(redis: Redis) {
  return new Queue('benefits-queue', {
    connection: redis,
  });
}
