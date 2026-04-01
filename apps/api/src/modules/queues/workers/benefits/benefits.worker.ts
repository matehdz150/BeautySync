import { Worker } from 'bullmq';
import { redis } from '../../redis/redis.provider';

import { processBookingBenefits } from './process-booking-benefits';
import { processReviewBenefits } from './process-review-benefits';
import { processPaymentBenefits } from './process-payment-benefits';

async function handler(name: string, data: any) {
  console.log('[benefits job]', name, data);

  switch (name) {
    case 'process-booking-benefits':
      return processBookingBenefits(data);

    case 'process-review-benefits':
      return processReviewBenefits(data);

    case 'process-payment-benefits':
      return processPaymentBenefits(data);

    default:
      console.warn('⚠️ Unhandled benefits job', name);
  }
}

async function main() {
  console.log('🚀 benefits worker running...');

  const worker = new Worker(
    'benefits-queue',
    async (job) => handler(job.name, job.data),
    {
      connection: redis,
      concurrency: 10,
    },
  );

  await worker.waitUntilReady();

  worker.on('completed', (job) => {
    console.log('✅ completed', job.name, job.id);
  });

  worker.on('failed', (job, err) => {
    console.error('❌ failed', job?.name, job?.id, err);
  });
}

main().catch(console.error);
