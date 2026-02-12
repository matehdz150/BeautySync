/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Worker } from 'bullmq';
import { redis } from '../redis/redis.provider';

import { db } from '../../db/client';
import { notifications } from '../../db/schema/notifications/notifications';

/* =========================================================
   📡 REALTIME EVENT PUBLISHER
========================================================= */

async function publishNotificationCreated(branchId: string, id: string) {
  await redis.publish(
    'realtime.notifications',
    JSON.stringify({
      scope: 'branch',
      branchId,
      event: 'notification.created',
      data: { id },
    }),
  );
}

/* ============================
   🔔 NOTIFICATIONS HANDLER
============================ */

async function handler(name: string, data: any) {
  console.log('[notifications job]', name, data);

  switch (name) {
    case 'notification.booking.created':
      return handleBookingCreated(data);

    case 'notification.booking.cancelled':
      return handleBookingCancelled(data);

    case 'notification.booking.rescheduled':
      return handleBookingRescheduled(data);

    default:
      console.warn('⚠️ Unhandled notification job', name);
  }
}

/* ============================
   📅 BOOKING CREATED
============================ */

type BookingCreatedJobData = {
  bookingId: string;
  branchId: string;
  payload: any;
};

async function handleBookingCreated(data: BookingCreatedJobData) {
  const { bookingId, branchId, payload } = data;

  if (!bookingId || !branchId) {
    console.warn('⚠️ booking.created skipped (missing ids)', data);
    return;
  }

  // 🏢 MANAGER
  const [created] = await db
    .insert(notifications)
    .values({
      target: 'MANAGER',
      kind: 'BOOKING_CREATED',
      bookingId,
      branchId,
      payload,
    })
    .returning();

  // 🔥 SOLO EVENTO
  await publishNotificationCreated(branchId, created.id);

  // 👤 CLIENT
  if (payload.client?.id) {
    await db.insert(notifications).values({
      target: 'CLIENT',
      kind: 'BOOKING_CREATED',
      bookingId,
      branchId,
      recipientClientId: payload.client.id,
      payload,
    });
  }

  console.log('🔔 booking.created notifications saved', {
    bookingId,
    branchId,
  });
}

/* ============================
   ❌ BOOKING CANCELLED
============================ */

type BookingCancelledJob = {
  bookingId: string;
  branchId: string;
  payload: any;
};

async function handleBookingCancelled(data: BookingCancelledJob) {
  const { bookingId, branchId, payload } = data;
  if (!bookingId || !branchId) return;

  const [created] = await db
    .insert(notifications)
    .values({
      target: 'MANAGER',
      kind: 'BOOKING_CANCELLED',
      bookingId,
      branchId,
      payload,
    })
    .returning();

  await publishNotificationCreated(branchId, created.id);

  if (payload.client?.id) {
    await db.insert(notifications).values({
      target: 'CLIENT',
      kind: 'BOOKING_CANCELLED',
      bookingId,
      branchId,
      recipientClientId: payload.client.id,
      payload,
    });
  }

  console.log('🔔 booking.cancelled notifications saved', {
    bookingId,
    branchId,
  });
}

/* ============================
   🔁 BOOKING RESCHEDULED
============================ */

type BookingRescheduledJob = {
  bookingId: string;
  branchId: string;
  payload: any;
};

async function handleBookingRescheduled(data: BookingRescheduledJob) {
  const { bookingId, branchId, payload } = data;
  if (!bookingId || !branchId || !payload) return;

  const [created] = await db
    .insert(notifications)
    .values({
      target: 'MANAGER',
      kind: 'BOOKING_RESCHEDULED',
      bookingId,
      branchId,
      payload,
    })
    .returning();

  await publishNotificationCreated(branchId, created.id);

  if (payload.client?.id) {
    await db.insert(notifications).values({
      target: 'CLIENT',
      kind: 'BOOKING_RESCHEDULED',
      bookingId,
      branchId,
      recipientClientId: payload.client.id,
      payload,
    });
  }

  console.log('🔔 booking.rescheduled notifications saved', {
    bookingId,
    branchId,
  });
}

/* ============================
   🚀 WORKER BOOTSTRAP
============================ */

async function main() {
  console.log('🚀 notifications worker running...');

  const worker = new Worker(
    'notifications',
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
