import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

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

    cancelledBy: 'PUBLIC' | 'MANAGER' | 'SYSTEM';
    managerUserId?: string;
    reason?: string;
  }) {
    await this.queue.add(
      'notification.booking.cancelled',
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
            cancelledBy: params.cancelledBy,
            managerUserId: params.managerUserId ?? null,
            reason: params.reason ?? null,
          },
        },
      },
      {
        jobId: `notification-booking-${params.bookingId}-cancelled`,
        delay: 0,
        removeOnComplete: true,
      },
    );
  }

  /**
   * 🔁 Booking reagendado
   */
  async bookingRescheduled(params: {
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
    } | null;

    staff: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    }[];

    totalCents: number;

    meta: {
      rescheduledBy: 'PUBLIC' | 'MANAGER' | 'SYSTEM';
      reason?: string;
      before: {
        startsAt: Date;
        endsAt: Date;
      };
      after: {
        startsAt: Date;
        endsAt: Date;
      };
    };
  }) {
    await this.queue.add(
      'notification.booking.rescheduled',
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
            rescheduledBy: params.meta.rescheduledBy,
            reason: params.meta.reason ?? null,

            before: {
              startsAt: params.meta.before.startsAt.toISOString(),
              endsAt: params.meta.before.endsAt.toISOString(),
            },

            after: {
              startsAt: params.meta.after.startsAt.toISOString(),
              endsAt: params.meta.after.endsAt.toISOString(),
            },
          },
        },
      },
      {
        jobId: `notification-booking-${params.bookingId}-rescheduled`,
        delay: 0,
        removeOnComplete: true,
      },
    );
  }
}
