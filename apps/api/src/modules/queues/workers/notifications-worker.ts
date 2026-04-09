/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Worker } from 'bullmq';
import { redis } from '../redis/redis.provider';

import { db } from '../../db/client';
import { notifications } from '../../db/schema/notifications/notifications';
import { eq, sql } from 'drizzle-orm';
import { trackJobMetric } from '../../metrics/bullmq-metrics';
import {
  prependManagerBranchLatest,
  toManagerNotificationCacheItem,
} from '../../notifications/notifications-cache.shared';
import { branches, branchImages } from '../../db/schema/branches';
import {
  appointments,
  clients,
  publicBookings,
  serviceCategories,
  services,
  staff,
} from '../../db/schema';
import {
  NotificationDetailSnapshot,
  NotificationSnapshotPayload,
} from '../../notifications/notifications.types';

/* =========================================================
   🔎 HELPERS
========================================================= */

async function getClientIdFromConversation(conversationId: string) {
  const row = await db.execute<{ clientId: string }>(sql`
    SELECT cl.id as "clientId"
    FROM conversations c
    JOIN public_bookings b ON b.id = c.booking_id
    JOIN public_user_clients puc ON puc.public_user_id = b.public_user_id
    JOIN clients cl ON cl.id = puc.client_id
    WHERE c.id = ${conversationId}
    LIMIT 1
  `);

  return row[0]?.clientId ?? null;
}

async function buildNotificationDetailSnapshot(params: {
  branchId: string;
  bookingId?: string | null;
}): Promise<NotificationDetailSnapshot> {
  const [branch] = await db
    .select({
      id: branches.id,
      name: branches.name,
      address: branches.address,
      description: branches.description,
      lat: branches.lat,
      lng: branches.lng,
    })
    .from(branches)
    .where(eq(branches.id, params.branchId))
    .limit(1);

  const images = await db
    .select({
      id: branchImages.id,
      url: branchImages.url,
      isCover: branchImages.isCover,
      position: branchImages.position,
    })
    .from(branchImages)
    .where(eq(branchImages.branchId, params.branchId))
    .orderBy(branchImages.position);

  if (!params.bookingId) {
    return {
      booking: null,
      branch: branch
        ? {
            ...branch,
            images,
          }
        : null,
    };
  }

  const [booking] = await db
    .select()
    .from(publicBookings)
    .where(eq(publicBookings.id, params.bookingId))
    .limit(1);

  if (!booking) {
    return {
      booking: null,
      branch: branch
        ? {
            ...branch,
            images,
          }
        : null,
    };
  }

  const appointmentRows = await db
    .select({
      id: appointments.id,
      start: appointments.start,
      end: appointments.end,
      status: appointments.status,
      paymentStatus: appointments.paymentStatus,
      priceCents: appointments.priceCents,
      notes: appointments.notes,
      service: {
        id: services.id,
        name: services.name,
        durationMin: services.durationMin,
        priceCents: services.priceCents,
        color: serviceCategories.colorHex,
      },
      staff: {
        id: staff.id,
        name: staff.name,
        avatarUrl: staff.avatarUrl,
      },
      client: {
        id: clients.id,
        name: clients.name,
        avatarUrl: clients.avatarUrl,
      },
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .where(eq(appointments.publicBookingId, booking.id));

  return {
    booking: {
      id: booking.id,
      branchId: booking.branchId,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      status: booking.status,
      paymentMethod: booking.paymentMethod ?? null,
      totalCents: booking.totalCents,
      notes: booking.notes ?? null,
      createdAt: booking.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: booking.updatedAt?.toISOString() ?? new Date().toISOString(),
      appointments: appointmentRows.map((row) => ({
        id: row.id,
        start: row.start.toISOString(),
        end: row.end.toISOString(),
        status: row.status,
        paymentStatus: row.paymentStatus,
        priceCents: row.priceCents,
        notes: row.notes ?? null,
        service: row.service
          ? row.service.id && row.service.name && row.service.durationMin !== null
            ? {
                id: row.service.id,
                name: row.service.name,
                durationMin: row.service.durationMin,
                priceCents: row.service.priceCents,
              }
            : null
          : null,
        staff: row.staff
          ? {
              id: row.staff.id,
              name: row.staff.name,
              avatarUrl: row.staff.avatarUrl,
            }
          : null,
        client: row.client
          ? {
              id: row.client.id,
              name: row.client.name,
              avatarUrl: row.client.avatarUrl,
            }
          : null,
      })),
    },
    branch: branch
      ? {
          id: branch.id,
          name: branch.name,
          address: branch.address,
          description: branch.description,
          lat: branch.lat ? String(branch.lat) : null,
          lng: branch.lng ? String(branch.lng) : null,
          images,
        }
      : null,
  };
}

function buildNotificationSnapshotPayload(params: {
  detail: NotificationDetailSnapshot;
  payload: {
    client?: { id: string; name: string | null; avatarUrl: string | null } | null;
    staff?: Array<{ id: string; name: string | null; avatarUrl: string | null }>;
    services?: Array<{
      id: string;
      name: string;
      durationMin: number;
      priceCents: number;
      color?: string | null;
    }>;
    meta?: Record<string, unknown>;
  };
}): NotificationSnapshotPayload {
  const primaryStaff = params.payload.staff?.[0] ?? null;

  return {
    booking: params.detail.booking
      ? {
          id: params.detail.booking.id,
          startsAt: params.detail.booking.startsAt,
          endsAt: params.detail.booking.endsAt,
          status: params.detail.booking.status,
          totalCents: params.detail.booking.totalCents,
        }
      : null,
    client: params.payload.client
      ? {
          id: params.payload.client.id,
          name: params.payload.client.name ?? 'Cliente',
          avatarUrl: params.payload.client.avatarUrl ?? null,
        }
      : null,
    staff: primaryStaff
      ? {
          id: primaryStaff.id,
          name: primaryStaff.name ?? 'Staff',
          avatarUrl: primaryStaff.avatarUrl ?? null,
        }
      : null,
    services: (params.payload.services ?? []).map((service) => ({
      id: service.id,
      name: service.name,
      durationMin: service.durationMin,
      priceCents: service.priceCents,
      color: service.color ?? null,
    })),
    branch: params.detail.branch
      ? {
          id: params.detail.branch.id,
          name: params.detail.branch.name,
          coverImage:
            params.detail.branch.images.find((image) => image.isCover)?.url ??
            params.detail.branch.images[0]?.url ??
            null,
        }
      : null,
    meta: {
      ...(params.payload.meta ?? {}),
      detail: params.detail,
    },
  };
}

/* =========================================================
   📡 REALTIME EVENT PUBLISHER
========================================================= */

async function publishNotificationCreated(params: {
  branchId: string;
  notification: ReturnType<typeof toManagerNotificationCacheItem>;
}) {
  await redis.publish(
    'realtime.notifications',
    JSON.stringify({
      scope: 'branch',
      branchId: params.branchId,
      event: 'notification.created',
      data: {
        notification: params.notification,
      },
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

    case 'notification.chat.message':
      return handleChatMessage(data);

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

  const detail = await buildNotificationDetailSnapshot({
    branchId,
    bookingId,
  });
  const snapshotPayload = buildNotificationSnapshotPayload({
    detail,
    payload,
  });

  // 🏢 MANAGER
  const [created] = await db
    .insert(notifications)
    .values({
      target: 'MANAGER',
      kind: 'BOOKING_CREATED',
      bookingId,
      branchId,
      payload: snapshotPayload,
    })
    .returning();

  const cacheItem = toManagerNotificationCacheItem(created);
  await prependManagerBranchLatest(redis, cacheItem);
  await publishNotificationCreated({
    branchId,
    notification: cacheItem,
  });

  // 👤 CLIENT
  if (payload.client?.id) {
    await db.insert(notifications).values({
      target: 'CLIENT',
      kind: 'BOOKING_CREATED',
      bookingId,
      branchId,
      recipientClientId: payload.client.id,
      payload: snapshotPayload,
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

  const detail = await buildNotificationDetailSnapshot({
    branchId,
    bookingId,
  });
  const snapshotPayload = buildNotificationSnapshotPayload({
    detail,
    payload,
  });

  const [created] = await db
    .insert(notifications)
    .values({
      target: 'MANAGER',
      kind: 'BOOKING_CANCELLED',
      bookingId,
      branchId,
      payload: snapshotPayload,
    })
    .returning();

  const cacheItem = toManagerNotificationCacheItem(created);
  await prependManagerBranchLatest(redis, cacheItem);
  await publishNotificationCreated({
    branchId,
    notification: cacheItem,
  });

  if (payload.client?.id) {
    await db.insert(notifications).values({
      target: 'CLIENT',
      kind: 'BOOKING_CANCELLED',
      bookingId,
      branchId,
      recipientClientId: payload.client.id,
      payload: snapshotPayload,
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

  const detail = await buildNotificationDetailSnapshot({
    branchId,
    bookingId,
  });
  const snapshotPayload = buildNotificationSnapshotPayload({
    detail,
    payload,
  });

  const [created] = await db
    .insert(notifications)
    .values({
      target: 'MANAGER',
      kind: 'BOOKING_RESCHEDULED',
      bookingId,
      branchId,
      payload: snapshotPayload,
    })
    .returning();

  const cacheItem = toManagerNotificationCacheItem(created);
  await prependManagerBranchLatest(redis, cacheItem);
  await publishNotificationCreated({
    branchId,
    notification: cacheItem,
  });

  if (payload.client?.id) {
    await db.insert(notifications).values({
      target: 'CLIENT',
      kind: 'BOOKING_RESCHEDULED',
      bookingId,
      branchId,
      recipientClientId: payload.client.id,
      payload: snapshotPayload,
    });
  }

  console.log('🔔 booking.rescheduled notifications saved', {
    bookingId,
    branchId,
  });
}

type ChatMessageJob = {
  conversationId: string;
  bookingId: string;
  branchId: string;
  payload: {
    preview: string;
    sender: {
      id: string;
      type: 'CLIENT' | 'USER';
      name: string;
      avatarUrl: string | null;
    };
  };
};

async function handleChatMessage(data: ChatMessageJob) {
  const { conversationId, bookingId, branchId, payload } = data;

  if (!conversationId || !branchId || !payload?.sender) {
    console.warn('⚠️ chat.message skipped (invalid payload)', data);
    return;
  }

  const sender = payload.sender;

  // ===============================
  // CLIENT → notificar MANAGER
  // ===============================
  if (sender.type === 'CLIENT') {
    const detail = await buildNotificationDetailSnapshot({
      branchId,
      bookingId,
    });
    const snapshotPayload = buildNotificationSnapshotPayload({
      detail,
      payload: {
        client: null,
        staff: [],
        services: [],
        meta: {
          conversationId,
          preview: payload.preview,
          sender: payload.sender,
        },
      },
    });

    const [created] = await db
      .insert(notifications)
      .values({
        target: 'MANAGER',
        kind: 'CHAT_MESSAGE',
        bookingId,
        branchId,
        payload: snapshotPayload,
      })
      .returning();

    const cacheItem = toManagerNotificationCacheItem(created);
    await prependManagerBranchLatest(redis, cacheItem);
    await publishNotificationCreated({
      branchId,
      notification: cacheItem,
    });

    console.log('🔔 chat.message → manager notified', {
      conversationId,
      branchId,
    });

    return;
  }

  // ===============================
  // USER → notificar CLIENT
  // ===============================
  if (sender.type === 'USER') {
    const clientId = await getClientIdFromConversation(conversationId);

    if (!clientId) {
      console.warn('⚠️ chat.message no client found', {
        conversationId,
      });
      return;
    }

    const clientDetail = await buildNotificationDetailSnapshot({
      branchId,
      bookingId,
    });
    const clientSnapshotPayload = buildNotificationSnapshotPayload({
      detail: clientDetail,
      payload: {
        client: null,
        staff: [],
        services: [],
        meta: {
          conversationId,
          preview: payload.preview,
          sender: payload.sender,
        },
      },
    });

    await db.insert(notifications).values({
      target: 'CLIENT',
      kind: 'CHAT_MESSAGE',
      bookingId,
      branchId,
      recipientClientId: clientId,
      payload: clientSnapshotPayload,
    });

    console.log('🔔 chat.message → client notified', {
      conversationId,
      branchId,
    });
  }
}

/* ============================
   🚀 WORKER BOOTSTRAP
============================ */

async function main() {
  console.log('🚀 notifications worker running...');

  const worker = new Worker(
    'notifications',
    async (job) => trackJobMetric(job.name, () => handler(job.name, job.data)),
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
