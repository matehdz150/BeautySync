/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Worker } from 'bullmq';
import { redis } from '../redis/redis.provider';

import { db } from '../../db/client';
import { notifications } from '../../db/schema/notifications/notifications';

/* ============================
   🔔 NOTIFICATIONS HANDLER
============================ */

async function handler(name: string, data: any) {
  console.log('[notifications job]', name, data);

  switch (name) {
    case 'notification.booking.created':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
type BookingCreatedPayload = {
  bookingId: string;

  schedule: {
    startsAt: string;
    endsAt: string;
  };

  services: {
    id: string;
    name: string;
    durationMin: number;
    priceCents: number;
  }[];

  client?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;

  staff: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  }[];

  meta?: {
    totalCents?: number;
  };
};

type BookingCreatedJobData = {
  bookingId: string;
  branchId: string;
  payload: BookingCreatedPayload;
};

async function handleBookingCreated(data: BookingCreatedJobData) {
  const { bookingId, branchId, payload } = data;

  if (!bookingId || !branchId) {
    console.warn('⚠️ booking.created skipped (missing ids)', data);
    return;
  }

  // ============================
  // 🏢 MANAGER (branch-level)
  // ============================
  await db.insert(notifications).values({
    target: 'MANAGER',
    kind: 'BOOKING_CREATED',
    bookingId,
    branchId,
    payload,
  });

  // ============================
  // 👤 CLIENT (direct)
  // ============================
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
    client: Boolean(payload.client?.id),
  });
}

/* ============================
   ❌ BOOKING CANCELLED
============================ */
async function handleBookingCancelled(data: any) {
  const { bookingId, branchId, cancelledBy, clientId, reason } = data;
  if (!bookingId || !branchId) return;

  // 🏢 MANAGER (branch-level)
  await db.insert(notifications).values({
    target: 'MANAGER',
    kind: 'BOOKING_CANCELLED',
    bookingId,
    branchId,
    payload: {
      bookingId,
      cancelledBy,
      reason,
    },
  });

  // 👤 CLIENT
  if (clientId) {
    await db.insert(notifications).values({
      target: 'CLIENT',
      kind: 'BOOKING_CANCELLED',
      bookingId,
      branchId,
      recipientClientId: clientId,
      payload: {
        bookingId,
        cancelledBy,
        reason,
      },
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
async function handleBookingRescheduled(data: any) {
  const {
    bookingId,
    branchId,
    rescheduledBy,
    before,
    after,
    clientId,
    reason,
  } = data;

  if (!bookingId || !branchId) return;

  // 🏢 MANAGER (branch-level)
  await db.insert(notifications).values({
    target: 'MANAGER',
    kind: 'BOOKING_RESCHEDULED',
    bookingId,
    branchId,
    payload: {
      bookingId,
      rescheduledBy,
      before,
      after,
      reason,
    },
  });

  // 👤 CLIENT
  if (clientId) {
    await db.insert(notifications).values({
      target: 'CLIENT',
      kind: 'BOOKING_RESCHEDULED',
      bookingId,
      branchId,
      recipientClientId: clientId,
      payload: {
        bookingId,
        rescheduledBy,
        before,
        after,
        reason,
      },
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
