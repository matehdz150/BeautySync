/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// notifications.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../db/client';
import { notifications } from '../db/schema/notifications/notifications';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { and, eq, isNull, lt, desc, inArray } from 'drizzle-orm';
import { users } from '../db/schema/users';
import { branches } from '../db/schema/branches';
import { notificationKindEnum } from '../db/schema';

@Injectable()
export class NotificationsService {
  async create(dto: CreateNotificationDto) {
    // =========================
    // 🔒 VALIDACIONES DE DOMINIO
    // =========================

    if (!dto.branchId) {
      throw new BadRequestException('branchId requerido');
    }

    if (dto.target === 'CLIENT' && !dto.recipientClientId) {
      throw new BadRequestException(
        'recipientClientId requerido cuando target = CLIENT',
      );
    }

    // =========================
    // 🧱 BUILD INSERT VALUES
    // =========================

    const values: typeof notifications.$inferInsert = {
      target: dto.target,
      kind: dto.kind,
      branchId: dto.branchId,
      bookingId: dto.bookingId ?? null,

      payload: {
        // 🔑 Siempre dejamos bookingId dentro del payload
        bookingId: dto.bookingId,

        // ⏰ Horarios
        schedule: dto.payload.schedule ?? null,

        // 🧾 Servicios
        services: dto.payload.services ?? [],

        // 👤 Cliente
        client: dto.payload.client ?? null,

        // 🧑‍💼 Staff
        staff: dto.payload.staff ?? [],

        // 💰 Meta
        meta: dto.payload.meta ?? {},
      },
    };

    if (dto.recipientUserId) {
      values.recipientUserId = dto.recipientUserId;
    }

    if (dto.recipientClientId) {
      values.recipientClientId = dto.recipientClientId;
    }

    // =========================
    // 💾 INSERT
    // =========================

    const [created] = await db.insert(notifications).values(values).returning();

    return created;
  }
  async markAsRead(notificationId: string, userId: string) {
    const updated = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.recipientUserId, userId),
          isNull(notifications.readAt),
        ),
      )
      .returning();

    if (!updated.length) {
      throw new NotFoundException('Notificación no encontrada');
    }

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
    userId: string,
    options?: {
      unread?: boolean;
      limit?: number;
      cursor?: string;
      kind?: 'ALL' | 'BOOKING' | 'CHAT';
    },
  ) {
    const limit = Math.min(options?.limit ?? 20, 50);

    // 1️⃣ organizationId del user
    const userRow = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRow.length || !userRow[0].organizationId) {
      return { items: [], nextCursor: null };
    }

    const organizationId = userRow[0].organizationId;

    // 2️⃣ branches de la organización
    const branchRows = await db
      .select({ id: branches.id })
      .from(branches)
      .where(eq(branches.organizationId, organizationId));

    if (!branchRows.length) {
      return { items: [], nextCursor: null };
    }

    const branchIds = branchRows.map((b) => b.id);

    // 3️⃣ condiciones base
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

    // 4️⃣ query final (DEVUELVE TODO)
    const rows = await db
      .select()
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
}
