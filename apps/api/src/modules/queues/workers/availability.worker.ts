import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { Worker } from 'bullmq';

import { AppModule } from 'src/app.module';
import { AvailabilitySnapshotWarmService } from 'src/modules/availability/infrastructure/adapters/availability-snapshot-warm.service';
import { redis } from '../redis/redis.provider';
import { trackJobMetric } from 'src/modules/metrics/bullmq-metrics';

type AvailabilitySnapshotJob = {
  branchId: string;
  date: string;
};

type AvailabilityWindowJob = {
  branchId: string;
  start: string;
  end: string;
};

async function main() {
  console.log('🚀 availability worker running...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const warm = app.get(AvailabilitySnapshotWarmService);

  const worker = new Worker(
    'availability',
    async (job) =>
      trackJobMetric(job.name, async () => {
        if (job.name === 'availability.snapshot.day') {
          const data = job.data as AvailabilitySnapshotJob;
          if (!data?.branchId || !data?.date) {
            console.warn(
              '⚠️ Invalid availability job payload',
              job.id,
              job.data,
            );
            return;
          }

          await warm.warmDay({
            branchId: data.branchId,
            date: data.date,
          });
          return;
        }

        if (job.name === 'availability.services.day') {
          const data = job.data as AvailabilitySnapshotJob;
          if (!data?.branchId || !data?.date) {
            console.warn(
              '⚠️ Invalid availability job payload',
              job.id,
              job.data,
            );
            return;
          }

          await warm.rebuildServicesDay({
            branchId: data.branchId,
            date: data.date,
          });
          return;
        }

        if (job.name === 'availability.window') {
          const data = job.data as AvailabilityWindowJob;
          if (!data?.branchId || !data?.start || !data?.end) {
            console.warn(
              '⚠️ Invalid availability job payload',
              job.id,
              job.data,
            );
            return;
          }

          await warm.warmWindow({
            branchId: data.branchId,
            start: data.start,
            end: data.end,
          });
          return;
        }

        console.warn('⚠️ Unhandled availability job', job.name);
      }),
    {
      connection: redis,
      concurrency: 10,
    },
  );

  await worker.waitUntilReady();

  worker.on('completed', (job) => {
    console.log('✅ availability job completed', job.name, job.id);
  });

  worker.on('failed', (job, err) => {
    console.error('❌ availability job failed', job?.name, job?.id, err);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
