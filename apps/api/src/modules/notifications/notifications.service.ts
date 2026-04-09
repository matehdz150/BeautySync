/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// notifications.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../db/client';
import { notifications } from '../db/schema/notifications/notifications';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { and, eq, isNull } from 'drizzle-orm';
import { redis } from '../queues/redis/redis.provider';
import { NotificationsCacheService } from './notifications-cache.service';
import { NotificationsRepository } from './notifications.repository';
import { toManagerNotificationCacheItem } from './notifications-cache.shared';
import { NotificationDetailSnapshot } from './notifications.types';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsCache: NotificationsCacheService,
    private readonly notificationsRepo: NotificationsRepository,
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

    const created = await this.notificationsRepo.create(values);

    if (created.target === 'MANAGER') {
      await this.notificationsCache.appendManagerNotification(
        toManagerNotificationCacheItem(created),
      );

      await redis.publish(
        'realtime.notifications',
        JSON.stringify({
          scope: 'branch',
          branchId: created.branchId,
          event: 'notification.created',
          data: {
            notification: toManagerNotificationCacheItem(created),
          },
        }),
      );
    }

    return created;
  }

  async markAsRead(notificationId: string, branchIds: string[]) {
    if (!branchIds.length) {
      throw new NotFoundException('Acceso inválido');
    }

    const cached = await this.notificationsCache.getNotificationById(notificationId);
    if (cached && !branchIds.includes(cached.branchId)) {
      throw new ForbiddenException('No autorizado');
    }

    const updated = await this.notificationsRepo.markAsRead(notificationId, branchIds);
    if (!updated) {
      throw new NotFoundException('Notificación no encontrada');
    }

    await this.notificationsCache.markAsRead({
      branchId: updated.branchId,
      notificationId: updated.id,
      readAt: updated.readAt?.toISOString() ?? new Date().toISOString(),
    });

    await redis.publish(
      'realtime.notifications',
      JSON.stringify({
        scope: 'branch',
        branchId: updated.branchId,
        event: 'notification.read',
        data: {
          id: updated.id,
          readAt: updated.readAt?.toISOString() ?? null,
        },
      }),
    );

    return { success: true };
  }

  async markAllAsReadForUser(userId: string, branchIds: string[]) {
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

    await this.notificationsCache.invalidateBranches(branchIds);

    return {
      success: true,
      updatedCount: updated.length,
    };
  }

  async findForManager(
    branchIds: string[],
    options?: {
      unread?: boolean;
      limit?: number;
      cursor?: string;
      kind?: 'ALL' | 'BOOKING' | 'CHAT';
    },
  ) {
    const limit = Math.min(options?.limit ?? 20, 50);
    if (!branchIds.length) {
      return { items: [], nextCursor: null };
    }

    const cached = await this.notificationsCache.getManagerFeed({
      branchIds,
      unread: options?.unread,
      kind: options?.kind,
      cursor: options?.cursor,
      limit,
    });

    if (cached) {
      return cached;
    }

    const rows = await this.notificationsRepo.findManagerFeed({
      branchIds,
      unread: options?.unread,
      kind: options?.kind,
      cursor: options?.cursor,
      limit,
    });

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;

    const result = {
      items,
      nextCursor: hasNextPage
        ? items[items.length - 1].createdAt.toISOString()
        : null,
    };
    return result;
  }

  async getNotificationListItem(
    notificationId: string,
    branchIds: string[],
  ) {
    if (!branchIds.length) {
      throw new NotFoundException('Acceso inválido');
    }

    const cached = await this.notificationsCache.getNotificationById(notificationId);
    if (cached) {
      if (!branchIds.includes(cached.branchId)) {
        throw new ForbiddenException('No autorizado');
      }

      return {
        ...cached,
        readAt: cached.readAt ? new Date(cached.readAt) : null,
        createdAt: new Date(cached.createdAt),
      };
    }

    const result = await this.notificationsRepo.findById(notificationId);

    if (!result) {
      throw new NotFoundException('Notificación no encontrada');
    }

    if (!branchIds.includes(result.branchId)) {
      throw new ForbiddenException('No autorizado');
    }

    await this.notificationsCache.setNotification(
      toManagerNotificationCacheItem(result),
    );

    return result;
  }

  async getNotificationDetail(
    notificationId: string,
    branchIds: string[],
  ) {
    if (!branchIds.length) {
      throw new NotFoundException('Acceso inválido');
    }

    const cachedNotification =
      await this.notificationsCache.getNotificationById(notificationId);
    const notification = cachedNotification
      ? {
          ...cachedNotification,
          readAt: cachedNotification.readAt
            ? new Date(cachedNotification.readAt)
            : null,
          createdAt: new Date(cachedNotification.createdAt),
        }
      : ((await this.notificationsRepo.findById(notificationId)) ?? null);

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    if (!branchIds.includes(notification.branchId)) {
      throw new ForbiddenException('No autorizado');
    }

    if (!cachedNotification) {
      await this.notificationsCache.setNotification(
        toManagerNotificationCacheItem(notification),
      );
    }

    const detail = this.extractNotificationDetail(notification.payload);
    return {
      notification,
      booking: detail?.booking ?? undefined,
      branch: detail?.branch ?? undefined,
    };
  }

  private extractNotificationDetail(payload: Record<string, unknown>) {
    const meta = payload?.meta;
    if (!meta || typeof meta !== 'object') {
      return this.buildLegacyDetail(payload);
    }

    const rawDetail = (meta as Record<string, unknown>).detail;
    if (!rawDetail || typeof rawDetail !== 'object') {
      return this.buildLegacyDetail(payload);
    }

    return rawDetail as NotificationDetailSnapshot;
  }

  private buildLegacyDetail(payload: Record<string, unknown>) {
    const schedule =
      payload.schedule && typeof payload.schedule === 'object'
        ? (payload.schedule as { startsAt?: string; endsAt?: string })
        : null;
    const services = Array.isArray(payload.services)
      ? (payload.services as Array<{
          id?: string;
          name?: string;
          durationMin?: number;
          priceCents?: number;
          color?: string | null;
        }>)
      : [];
    const client =
      payload.client && typeof payload.client === 'object'
        ? (payload.client as {
            id?: string;
            name?: string | null;
            avatarUrl?: string | null;
          })
        : null;
    const staff = Array.isArray(payload.staff)
      ? (payload.staff as Array<{
          id?: string;
          name?: string | null;
          avatarUrl?: string | null;
        }>)
      : [];
    const branch =
      payload.branch && typeof payload.branch === 'object'
        ? (payload.branch as {
            id?: string;
            name?: string;
            coverImage?: string | null;
          })
        : null;
    const totalCents =
      metaHasTotal(payload.meta) ? Number((payload.meta as { totalCents?: unknown }).totalCents ?? 0) : 0;

    if (!schedule?.startsAt || !schedule?.endsAt) {
      return {
        booking: null,
        branch: branch
          ? {
              id: branch.id ?? '',
              name: branch.name ?? 'Sucursal',
              address: null,
              description: null,
              lat: null,
              lng: null,
              images: branch.coverImage
                ? [
                    {
                      id: 'cover',
                      url: branch.coverImage,
                      isCover: true,
                      position: 0,
                    },
                  ]
                : [],
            }
          : null,
      } satisfies NotificationDetailSnapshot;
    }

    const startsAt = schedule.startsAt;
    const endsAt = schedule.endsAt;

    return {
      booking: {
        id: typeof payload.bookingId === 'string' ? payload.bookingId : '',
        branchId: typeof payload.branchId === 'string' ? payload.branchId : '',
        startsAt,
        endsAt,
        status: 'CONFIRMED',
        paymentMethod: null,
        totalCents,
        notes: null,
        createdAt: startsAt,
        updatedAt: endsAt,
        appointments: services.map((service, index) => ({
          id: service.id ?? `legacy-${index}`,
          start: startsAt,
          end: endsAt,
          status: 'CONFIRMED',
          paymentStatus: 'UNPAID',
          priceCents: service.priceCents ?? null,
          notes: null,
          service: service.id && service.name
            ? {
                id: service.id,
                name: service.name,
                durationMin: service.durationMin ?? 0,
                priceCents: service.priceCents ?? null,
              }
            : null,
          staff: staff[index]
            ? {
                id: staff[index].id ?? `staff-${index}`,
                name: staff[index].name ?? null,
                avatarUrl: staff[index].avatarUrl ?? null,
              }
            : staff[0]
              ? {
                  id: staff[0].id ?? 'staff',
                  name: staff[0].name ?? null,
                  avatarUrl: staff[0].avatarUrl ?? null,
                }
              : null,
          client: client?.id
            ? {
                id: client.id,
                name: client.name ?? null,
                avatarUrl: client.avatarUrl ?? null,
              }
            : null,
        })),
      },
      branch: branch
        ? {
            id: branch.id ?? '',
            name: branch.name ?? 'Sucursal',
            address: null,
            description: null,
            lat: null,
            lng: null,
            images: branch.coverImage
              ? [
                  {
                    id: 'cover',
                    url: branch.coverImage,
                    isCover: true,
                    position: 0,
                  },
                ]
              : [],
          }
        : null,
    } satisfies NotificationDetailSnapshot;
  }
}

function metaHasTotal(
  meta: unknown,
): meta is {
  totalCents?: unknown;
} {
  return Boolean(meta && typeof meta === 'object');
}
