/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Worker, Queue } from 'bullmq';
import { redis } from '../redis/redis.provider';

import { db } from '../../db/client';

import { and, eq, inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';

import { publicBookings } from '../../db/schema/public/public-bookings';
import { publicUsers } from '../../db/schema/public/public-users';
import { branches } from '../../db/schema/branches/branches';
import { branchImages } from '../../db/schema';
import { appointments } from '../../db/schema/appointments/appointments';

import { services } from '../../db/schema';
import { staff } from '../../db/schema/staff/staff';

import type { BookingMailPayload } from '../mail/types/mail.types';

const mailQueue = new Queue('mail-queue', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

function formatMoneyMXN(cents: number) {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  });
}

async function buildBookingMailPayload(
  bookingId: string,
): Promise<BookingMailPayload | null> {
  // 1) booking
  const booking = await db.query.publicBookings.findFirst({
    where: eq(publicBookings.id, bookingId),
  });
  if (!booking) return null;

  // 2) public user
  if (!booking.publicUserId) {
    throw new Error(`Booking ${booking.id} has no publicUserId`);
  }

  const publicUser = await db.query.publicUsers.findFirst({
    where: eq(publicUsers.id, booking.publicUserId),
  });

  const to = publicUser?.email?.trim();
  if (!to) return null;

  // 3) branch
  const branch = await db.query.branches.findFirst({
    where: eq(branches.id, booking.branchId),
  });
  if (!branch) return null;

  // 4) cover image
  const imgs = await db.query.branchImages.findMany({
    where: eq(branchImages.branchId, branch.id),
  });

  const coverUrl =
    imgs.find((x) => x.isCover)?.url ??
    imgs.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0]
      ?.url ??
    null;

  // 5) appointments
  const appts = await db.query.appointments.findMany({
    where: eq(appointments.publicBookingId, bookingId),
  });

  const serviceIds = Array.from(new Set(appts.map((a) => a.serviceId))).filter(
    Boolean,
  );

  const staffIds = Array.from(new Set(appts.map((a) => a.staffId))).filter(
    Boolean,
  );

  const serviceRows = serviceIds.length
    ? await db.query.services.findMany({
        where: inArray(services.id, serviceIds),
      })
    : [];

  const staffRows = staffIds.length
    ? await db.query.staff.findMany({
        where: inArray(staff.id, staffIds),
      })
    : [];

  const serviceMap = new Map(serviceRows.map((s) => [s.id, s]));
  const staffMap = new Map(staffRows.map((s) => [s.id, s]));

  const serviceLine =
    appts.length > 0
      ? Array.from(
          new Set(
            appts
              .map((a) => serviceMap.get(a.serviceId)?.name)
              .filter((x): x is string => Boolean(x)),
          ),
        )
          .slice(0, 3)
          .join(' • ')
      : undefined;

  const staffLine =
    appts.length > 0
      ? Array.from(
          new Set(
            appts
              .map((a) => staffMap.get(a.staffId)?.name)
              .filter((x): x is string => Boolean(x)),
          ),
        )
          .slice(0, 2)
          .join(' • ')
      : undefined;

  // 6) labels
  const tz = 'America/Mexico_City';

  const startLocal = DateTime.fromJSDate(booking.startsAt, { zone: 'utc' })
    .setZone(tz)
    .setLocale('es');

  const dateLabel = startLocal.toLocaleString({
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const timeLabel = startLocal.toLocaleString(DateTime.TIME_SIMPLE);

  // 7) links
  const baseUrl = process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000';
  const manageUrl = `${baseUrl}/me/bookings/${bookingId}`;

  return {
    to,

    userName: publicUser?.name ?? null,

    branchName: branch.name ?? null,
    branchAddress: branch.address ?? null,
    branchImageUrl: coverUrl ?? null,

    dateLabel: dateLabel ?? null,
    timeLabel: timeLabel ?? null,

    bookingId,
    totalLabel: formatMoneyMXN(booking.totalCents) ?? null,

    manageUrl,

    directionsUrl: null,
    establishmentUrl: null,

    serviceLine,
    staffLine,
  };
}

/**
 * Jobs delayed => usar ventana de tolerancia
 */
function shouldSendReminderWindow(params: {
  startAtUTC: Date;
  thresholdMinutes: number;
  toleranceMinutes: number;
}) {
  const now = DateTime.utc();
  const start = DateTime.fromJSDate(params.startAtUTC, { zone: 'utc' });

  if (start <= now) {
    return { ok: false, diffMinutes: 0, min: 0, max: 0 };
  }

  const diffMinutes = start.diff(now, 'minutes').minutes;

  const min = params.thresholdMinutes - params.toleranceMinutes;
  const max = params.thresholdMinutes + params.toleranceMinutes;

  const ok = diffMinutes >= min && diffMinutes <= max;

  return { ok, diffMinutes, min, max };
}

async function handler(name: string, data: any) {
  console.log('[booking-events job]', name, data);

  const bookingId = data?.bookingId as string | undefined;
  if (!bookingId) {
    console.log('⚠️ bookingId missing in job data');
    return;
  }

  const booking = await db.query.publicBookings.findFirst({
    where: eq(publicBookings.id, bookingId),
  });

  if (!booking) {
    console.log('⚠️ booking not found', { bookingId });
    return;
  }

  // 👇 IMPORTANTE:
  // A TS le está llegando un union raro, entonces casteamos a string
  // para permitir comparar con CANCELLED sin TS2367.
  const status = booking.status as unknown as string;

  // 🚫 Si está cancelado, no mandes nada
  if (status === 'CANCELLED') {
    console.log('ℹ️ booking cancelled, skipping mail events', {
      bookingId,
      status,
    });
    return;
  }

  const payload = await buildBookingMailPayload(bookingId);

  if (!payload) {
    console.log('⚠️ payload could not be built', { bookingId });
    return;
  }

  // ==========================
  // CONFIRMATION
  // ==========================
  if (name === 'booking.confirmation') {
    await mailQueue.add('mail.booking.confirmation', payload, {
      jobId: `mail:${bookingId}:confirmation`,
    });
    return;
  }

  // ==========================
  // REMINDERS (window)
  // ==========================
  const w24h = shouldSendReminderWindow({
    startAtUTC: booking.startsAt,
    thresholdMinutes: 24 * 60,
    toleranceMinutes: 10,
  });

  const w2h = shouldSendReminderWindow({
    startAtUTC: booking.startsAt,
    thresholdMinutes: 2 * 60,
    toleranceMinutes: 10,
  });

  const w30m = shouldSendReminderWindow({
    startAtUTC: booking.startsAt,
    thresholdMinutes: 30,
    toleranceMinutes: 5,
  });

  if (name === 'booking.reminder.24h') {
    console.log('⏱ reminder24h window check', {
      bookingId,
      diffMinutes: Number(w24h.diffMinutes.toFixed(2)),
      window: `[${w24h.min}..${w24h.max}]`,
      ok: w24h.ok,
    });

    if (!w24h.ok) {
      console.log('⏭️ skip reminder 24h (outside window)', { bookingId });
      return;
    }

    await mailQueue.add('mail.booking.reminder24h', payload, {
      jobId: `mail:${bookingId}:reminder24h`,
    });
    return;
  }

  if (name === 'booking.reminder.2h') {
    console.log('⏱ reminder2h window check', {
      bookingId,
      diffMinutes: Number(w2h.diffMinutes.toFixed(2)),
      window: `[${w2h.min}..${w2h.max}]`,
      ok: w2h.ok,
    });

    if (!w2h.ok) {
      console.log('⏭️ skip reminder 2h (outside window)', { bookingId });
      return;
    }

    await mailQueue.add('mail.booking.reminder2h', payload, {
      jobId: `mail:${bookingId}:reminder2h`,
    });
    return;
  }

  if (name === 'booking.reminder.30m') {
    console.log('⏱ reminder30m window check', {
      bookingId,
      diffMinutes: Number(w30m.diffMinutes.toFixed(2)),
      window: `[${w30m.min}..${w30m.max}]`,
      ok: w30m.ok,
    });

    if (!w30m.ok) {
      console.log('⏭️ skip reminder 30m (outside window)', { bookingId });
      return;
    }

    await mailQueue.add('mail.booking.reminder30m', payload, {
      jobId: `mail:${bookingId}:reminder30m`,
    });
    return;
  }

  // ==========================
  // FOLLOWUP
  // ==========================
  if (name === 'booking.followup.5m_after') {
    await mailQueue.add('mail.booking.followup5m', payload, {
      jobId: `mail:${bookingId}:followup5m`,
    });
    return;
  }

  // ==========================
  // MARK PAST
  // ==========================
  if (name === 'booking.markPast') {
    // aquí sí tiene sentido no tocar cancelados/completed
    if (status === 'CANCELLED' || status === 'COMPLETED') {
      console.log('ℹ booking already finished, skipping', {
        bookingId,
        status,
      });
      return;
    }

    await db
      .update(publicBookings)
      .set({
        status: 'COMPLETED',
        updatedAt: new Date(),
      })
      .where(eq(publicBookings.id, bookingId));

    await db
      .update(appointments)
      .set({
        status: 'COMPLETED',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(appointments.publicBookingId, bookingId),
          inArray(appointments.status, ['PENDING', 'CONFIRMED']),
        ),
      );

    console.log('✅ booking + appointments marked as COMPLETED', { bookingId });
    return;
  }

  console.log('⚠️ job no manejado:', name);
}

// eslint-disable-next-line @typescript-eslint/require-await
async function main() {
  console.log('🚀 booking worker running...');

  const worker = new Worker(
    'booking-events',
    async (job) => handler(job.name, job.data),
    {
      connection: redis,
      concurrency: 10,
    },
  );

  worker.on('completed', (job) => {
    console.log('✅ completed', job.name, job.id);
  });

  worker.on('failed', (job, err) => {
    console.error('❌ failed', job?.name, job?.id, err);
  });
}

main().catch(console.error);
