/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// notifications.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { db } from '../db/client';
import { notifications } from '../db/schema/notifications/notifications';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { and, eq, isNull, lt, desc, inArray } from 'drizzle-orm';
import { branches, branchImages } from '../db/schema/branches';
import {
  appointments,
  clients,
  notificationKindEnum,
  publicBookings,
  serviceCategories,
  services,
  staff,
} from '../db/schema';
import { NotificationsSseService } from './notifications-sse.service';
import * as client from 'src/modules/db/client';
import { redis } from '../queues/redis/redis.provider';
import { BranchCacheService } from '../cache/application/branch-cache.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly sseService: NotificationsSseService,
    private readonly branchCache: BranchCacheService,
    @Inject('DB') private db: client.DB,
  ) {}
  async create(dto: CreateNotificationDto) {
    if (!dto.branchId) {
      throw new BadRequestException('branchId requerido');
    }

    if (dto.target === 'CLIENT' && !dto.recipientClientId) {
      throw new BadRequestException(
        'recipientClientId requerido cuando target = CLIENT',
      );
    }

    const values: typeof notifications.$inferInsert = {
      target: dto.target,
      kind: dto.kind,
      branchId: dto.branchId,
      bookingId: dto.bookingId ?? null,
      payload: {
        bookingId: dto.bookingId,
        schedule: dto.payload.schedule ?? null,
        services: dto.payload.services ?? [],
        client: dto.payload.client ?? null,
        staff: dto.payload.staff ?? [],
        meta: dto.payload.meta ?? {},
      },
    };

    if (dto.recipientUserId) {
      values.recipientUserId = dto.recipientUserId;
    }

    if (dto.recipientClientId) {
      values.recipientClientId = dto.recipientClientId;
    }

    const [created] = await this.db
      .insert(notifications)
      .values(values)
      .returning();

    return created;
  }

  async markAsRead(notificationId: string, organizationId: string | null) {
    if (!organizationId) {
      throw new NotFoundException('Acceso inválido');
    }

    const branchIds = await this.branchCache.getBranchIds(organizationId);
    if (!branchIds.length) {
      throw new NotFoundException('No autorizado');
    }

    const [notification] = await db
      .select({
        id: notifications.id,
        branchId: notifications.branchId,
      })
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    if (!branchIds.includes(notification.branchId)) {
      throw new NotFoundException('No autorizado');
    }

    const [updated] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, notificationId))
      .returning();

    await redis.publish(
      'realtime.notifications',
      JSON.stringify({
        scope: 'branch',
        branchId: updated.branchId,
        event: 'notification.read',
        data: { id: updated.id },
      }),
    );

    return { success: true };
  }

  async markAllAsReadForUser(userId: string) {
    const updated = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.recipientUserId, userId),
          isNull(notifications.readAt),
        ),
      )
      .returning({ id: notifications.id });

    return {
      success: true,
      updatedCount: updated.length,
    };
  }

  async findForManager(
    organizationId: string | null,
    options?: {
      unread?: boolean;
      limit?: number;
      cursor?: string;
      kind?: 'ALL' | 'BOOKING' | 'CHAT';
    },
  ) {
    const limit = Math.min(options?.limit ?? 20, 50);

    if (!organizationId) {
      return { items: [], nextCursor: null };
    }

    const branchIds = await this.branchCache.getBranchIds(organizationId);
    if (!branchIds.length) {
      return { items: [], nextCursor: null };
    }

    const conditions = [
      eq(notifications.target, 'MANAGER'),
      inArray(notifications.branchId, branchIds),
    ];

    if (options?.unread === true) {
      conditions.push(isNull(notifications.readAt));
    }

    if (options?.cursor) {
      const cursorDate = new Date(options.cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        conditions.push(lt(notifications.createdAt, cursorDate));
      }
    }

    if (options?.kind && options.kind !== 'ALL') {
      const kindGroups: Record<
        'BOOKING' | 'CHAT',
        (typeof notificationKindEnum.enumValues)[number][]
      > = {
        BOOKING: [
          'BOOKING_CREATED',
          'BOOKING_CANCELLED',
          'BOOKING_RESCHEDULED',
        ],
        CHAT: ['CHAT_MESSAGE'],
      };

      conditions.push(inArray(notifications.kind, kindGroups[options.kind]));
    }

    const rows = await db
      .select({
        id: notifications.id,
        bookingId: notifications.bookingId,
        branchId: notifications.branchId,
        kind: notifications.kind,
        payload: notifications.payload,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1);

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;

    return {
      items,
      nextCursor: hasNextPage
        ? items[items.length - 1].createdAt.toISOString()
        : null,
    };
  }

  async getNotificationListItem(
    notificationId: string,
    organizationId: string | null,
  ) {
    if (!organizationId) {
      throw new NotFoundException('Acceso inválido');
    }

    const branchIds = await this.branchCache.getBranchIds(organizationId);
    if (!branchIds.length) {
      throw new NotFoundException('No autorizado');
    }

    const [result] = await db
      .select({
        id: notifications.id,
        bookingId: notifications.bookingId,
        branchId: notifications.branchId,
        kind: notifications.kind,
        payload: notifications.payload,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (!result) {
      throw new NotFoundException('Notificación no encontrada');
    }

    if (!branchIds.includes(result.branchId)) {
      throw new NotFoundException('No autorizado');
    }

    return result;
  }

  async getNotificationDetail(
    notificationId: string,
    organizationId: string | null,
  ) {
    // ============================
    // 1️⃣ Notification
    // ============================

    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    // ============================
    // 2️⃣ Validar acceso manager
    // ============================

    if (!organizationId) {
      throw new NotFoundException('Acceso inválido');
    }

    const orgBranches = await this.branchCache.getBranches(organizationId);
    const branch = orgBranches.find((item) => item.id === notification.branchId);

    if (!branch) {
      throw new NotFoundException('No autorizado');
    }

    if (!notification.bookingId) {
      return { notification, branch };
    }

    // ============================
    // 3️⃣ Booking
    // ============================

    const [booking] = await db
      .select()
      .from(publicBookings)
      .where(eq(publicBookings.id, notification.bookingId))
      .limit(1);

    if (!booking) {
      return { notification, branch };
    }

    // ============================
    // 4️⃣ Appointments + Services + Staff
    // ============================

    const appointmentRows = await db
      .select({
        appointmentId: appointments.id,
        start: appointments.start,
        end: appointments.end,
        status: appointments.status,
        paymentStatus: appointments.paymentStatus,
        priceCents: appointments.priceCents,

        service: {
          id: services.id,
          name: services.name,
          durationMin: services.durationMin,
          priceCents: services.priceCents,
        },

        category: {
          id: serviceCategories.id,
          name: serviceCategories.name,
          icon: serviceCategories.icon,
          colorHex: serviceCategories.colorHex,
        },

        staff: {
          id: staff.id,
          name: staff.name,
          avatarUrl: staff.avatarUrl,
          jobRole: staff.jobRole,
        },

        client: {
          id: clients.id,
          name: clients.name,
          avatarUrl: clients.avatarUrl,
          email: clients.email,
          phone: clients.phone,
        },
      })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(
        serviceCategories,
        eq(services.categoryId, serviceCategories.id),
      )
      .leftJoin(staff, eq(appointments.staffId, staff.id))
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .where(eq(appointments.publicBookingId, booking.id));

    // ============================
    // 5️⃣ Branch Images
    // ============================

    const branchImgs = await db
      .select()
      .from(branchImages)
      .where(eq(branchImages.branchId, branch.id))
      .orderBy(branchImages.position);

    // ============================
    // 6️⃣ Response estructurada
    // ============================

    return {
      notification,
      booking: {
        ...booking,
        appointments: appointmentRows,
      },
      branch: {
        ...branch,
        images: branchImgs,
      },
    };
  }
}
