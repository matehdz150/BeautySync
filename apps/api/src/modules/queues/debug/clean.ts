import { Queue } from 'bullmq';
import { redis } from '../redis/redis.provider';

async function main() {
  const q = new Queue('mail-queue', { connection: redis });

  await q.drain(true); // remueve waiting + delayed
  await q.clean(0, 10000, 'failed');
  await q.clean(0, 10000, 'completed');

  console.log('✅ mail-queue cleaned');
  process.exit(0);
}

main().catch(console.error);
