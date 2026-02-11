import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';

@Injectable()
export class NotificationsJobsService {
  constructor(
    @Inject('NOTIFICATIONS_QUEUE')
    private readonly queue: Queue,
  ) {}

  /**
   * 📅 Booking creado
   */
  async bookingCreated(params: {
    bookingId: string;
    branchId: string;

    schedule: {
      startsAt: Date;
      endsAt: Date;
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
    };

    staff: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    }[];

    totalCents: number;
  }) {
    await this.queue.add(
      'notification.booking.created',
      {
        bookingId: params.bookingId,
        branchId: params.branchId,

        payload: {
          bookingId: params.bookingId,

          schedule: {
            startsAt: params.schedule.startsAt.toISOString(),
            endsAt: params.schedule.endsAt.toISOString(),
          },

          services: params.services,

          client: params.client ?? null,

          staff: params.staff,

          meta: {
            totalCents: params.totalCents,
          },
        },
      },
      {
        // ⚠️ BullMQ NO permite ":" en jobId
        jobId: `notification-booking-${params.bookingId}-created`,
        delay: 0,
        removeOnComplete: true,
      },
    );
  }

  /**
   * ❌ Booking cancelado
   */
  async bookingCancelled(params: {
    bookingId: string;
    cancelledBy: 'PUBLIC' | 'MANAGER' | 'SYSTEM';
    managerUserId?: string;
    clientId?: string;
    reason?: string;
  }) {
    await this.queue.add('notification.booking.cancelled', params, {
      jobId: `notification:booking:${params.bookingId}:cancelled`,
      delay: 0,
    });
  }

  /**
   * 🔁 Booking reagendado
   */
  async bookingRescheduled(params: {
    bookingId: string;
    rescheduledBy: 'PUBLIC' | 'MANAGER' | 'SYSTEM';
    before: {
      startsAt: Date;
      endsAt: Date;
    };
    after: {
      startsAt: Date;
      endsAt: Date;
    };
    managerUserId?: string;
    clientId?: string;
    reason?: string;
  }) {
    await this.queue.add(
      'notification.booking.rescheduled',
      {
        ...params,
        before: {
          startsAt: params.before.startsAt.toISOString(),
          endsAt: params.before.endsAt.toISOString(),
        },
        after: {
          startsAt: params.after.startsAt.toISOString(),
          endsAt: params.after.endsAt.toISOString(),
        },
      },
      {
        jobId: `notification-booking-${params.bookingId}-rescheduled-${randomUUID()}`,
        delay: 0,
        removeOnComplete: true,
      },
    );
  }

  /**
   * 💬 Nuevo mensaje de chat
   */
  async chatMessage(params: {
    chatId: string;
    messageId: string;
    senderUserId?: string;
    recipientUserId?: string;
    recipientClientId?: string;
  }) {
    await this.queue.add('notification.chat.message', params, {
      jobId: `notification:chat:${params.chatId}:${params.messageId}`,
      delay: 0,
    });
  }

  /**
   * ⭐ Nueva reseña
   */
  async newReview(params: {
    bookingId: string;
    rating: number;
    comment?: string;
    managerUserId: string;
  }) {
    await this.queue.add('notification.review.created', params, {
      jobId: `notification:review:${params.bookingId}`,
      delay: 0,
    });
  }
}
