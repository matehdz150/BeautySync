/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { createHash, randomUUID } from 'crypto';
import { DateTime } from 'luxon';
import { and, eq, inArray, sql } from 'drizzle-orm';

import * as client from 'src/modules/db/client';

import {
  BookingRescheduleReason,
  appointmentStatusHistory,
  appointments,
  bookingReschedules,
  branchSettings,
  branches,
  clients,
  coupons,
  giftCardTransactions,
  giftCards,
  payments,
  publicBookings,
  publicUserClients,
  publicUsers,
  services,
  staff,
  users,
} from 'src/modules/db/schema';

import {
  CreatePublicBookingDto,
  PublicPaymentMethodEnum,
} from './dto/create-booking-public.dto';
import { PublicBookingJobsService } from '../queues/booking/public-booking-job.service';

import { buildAppointmentOverlapWhere } from '../lib/booking/booking.overlap';
import { publicBookingRatings } from '../db/schema/rankings/public_booking_ratings';
import { NotificationsJobsService } from '../queues/notifications/notifications-job.service';
import { CACHE_PORT, SLOT_LOCK_PORT } from '../cache/core/ports/tokens';
import { CachePort } from '../cache/core/ports/cache.port';
import { SlotLockPort } from '../cache/core/ports/slot-lock.port';
import { ValidateCouponUseCase } from '../cupons/core/use-cases/validate-cupon.use-case';
import { DomainEventBus } from 'src/shared/domain-events/domain-event-bus';
import { CalendarRealtimePublisher } from '../calendar/calendar-realtime.publisher';
import { PublicBranchCacheService } from '../cache/application/public-branch-cache.service';
import { BranchSettingsCacheService } from '../cache/application/branch-settings-cache.service';
import { BranchServicesCacheService } from '../cache/application/branch-services-cache.service';
import { BranchStaffCacheService } from '../cache/application/branch-staff-cache.service';
import { AvailabilityCacheService } from '../availability/infrastructure/adapters/availability-cache.service';
import { AvailabilitySnapshotWarmService } from '../availability/infrastructure/adapters/availability-snapshot-warm.service';
import { PaymentBenefitsRefreshService } from '../payments/application/payment-benefits-refresh.service';
import { AvailabilitySnapshotRepository } from '../availability/core/ports/availability-snapshot.repository';
import { AVAILABILITY_SNAPSHOT_REPOSITORY } from '../availability/core/ports/tokens';
import { AvailabilityDaySnapshot } from '../availability/core/entities/availability-day-snapshot.entity';

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T[];
    } catch {
      return [];
    }
  }

  return [];
}

type PublicBookingAppointmentRow = {
  id: string;
  status: string;
  startUtc: string;
  endUtc: string;
  priceCents: number | null;
  service: { id: string; name: string };
  staff: { id: string; name: string; avatarUrl: string | null };
};

type ManagerBookingAppointmentRow = {
  id: string;
  status: string;
  paymentStatus: string;
  startUtc: string;
  endUtc: string;
  priceCents: number | null;
  service: { id: string; name: string; categoryColor: string };
  staff: { id: string; name: string; avatarUrl: string | null };
};

@Injectable()
export class BookingsCoreService {
  private static readonly MANAGER_CHAIN_CACHE_TTL_SECONDS = 45;
  private readonly managerChainInflight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly publicBookingJobsService: PublicBookingJobsService,
    private readonly notificationsJobService: NotificationsJobsService,
    private readonly validateCoupon: ValidateCouponUseCase,
    @Inject('DB') private readonly db: client.DB,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
    @Inject(SLOT_LOCK_PORT)
    private readonly slotLock: SlotLockPort,
    private readonly eventBus: DomainEventBus,
    private readonly calendarRealtime: CalendarRealtimePublisher,
    private readonly publicBranchCache: PublicBranchCacheService,
    private readonly branchSettingsCache: BranchSettingsCacheService,
    private readonly branchServicesCache: BranchServicesCacheService,
    private readonly branchStaffCache: BranchStaffCacheService,
    private readonly availabilityCache: AvailabilityCacheService,
    private readonly availabilityWarm: AvailabilitySnapshotWarmService,
    @Inject(AVAILABILITY_SNAPSHOT_REPOSITORY)
    private readonly availabilitySnapshots: AvailabilitySnapshotRepository,
    private readonly paymentBenefitsRefresh: PaymentBenefitsRefreshService,
  ) {}

  private buildManagerChainCacheKey(params: {
    kind: 'build' | 'next-services' | 'next-staff-options';
    branchId: string;
    date: string;
    pinnedStartIso: string;
    chain: { serviceId: string; staffId: string | 'ANY' }[];
    nextServiceId?: string;
  }) {
    const suffix = createHash('sha1')
      .update(
        JSON.stringify({
          pinnedStartIso: params.pinnedStartIso,
          chain: params.chain,
          nextServiceId: params.nextServiceId ?? null,
        }),
      )
      .digest('hex');

    return `manager:chain:${params.kind}:${params.branchId}:${params.date}:${suffix}`;
  }

  private async getOrSetManagerChainCache<T>(
    key: string,
    factory: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached) {
      return cached;
    }

    const inflight = this.managerChainInflight.get(key) as Promise<T> | undefined;
    if (inflight) {
      return inflight;
    }

    const promise = (async () => {
      const result = await factory();
      await this.cache.set(
        key,
        result,
        BookingsCoreService.MANAGER_CHAIN_CACHE_TTL_SECONDS,
      );
      return result;
    })();

    this.managerChainInflight.set(key, promise);

    try {
      return await promise;
    } finally {
      if (this.managerChainInflight.get(key) === promise) {
        this.managerChainInflight.delete(key);
      }
    }
  }

  private async getAvailabilityDaySnapshotOrWarm(
    branchId: string,
    date: string,
  ): Promise<AvailabilityDaySnapshot> {
    let snapshot = await this.availabilitySnapshots.get(branchId, date);
    if (snapshot) {
      return snapshot;
    }

    await this.availabilityWarm.warmDay({ branchId, date });
    snapshot = await this.availabilitySnapshots.get(branchId, date);

    if (!snapshot) {
      throw new BadRequestException('Availability snapshot not ready');
    }

    return snapshot;
  }

  private async getAvailabilityDaySnapshotStrict(
    branchId: string,
    date: string,
  ): Promise<AvailabilityDaySnapshot> {
    const snapshot = await this.availabilitySnapshots.get(branchId, date);

    if (!snapshot) {
      throw new BadRequestException('SNAPSHOT_NOT_READY');
    }

    return snapshot;
  }

  private normalizeManagerChainStart(params: {
    pinnedStartIso: string;
    date: string;
    timezone: string;
  }) {
    const pinned = DateTime.fromISO(params.pinnedStartIso).set({
      millisecond: 0,
      second: 0,
    });

    if (!pinned.isValid) {
      throw new BadRequestException('Invalid pinnedStartIso');
    }

    const pinnedInTz = pinned.setZone(params.timezone);
    if (pinnedInTz.toISODate() !== params.date) {
      throw new BadRequestException(
        `pinnedStartIso does not match date ${params.date}`,
      );
    }

    return pinned.toUTC();
  }

  private createSnapshotContext(snapshot: AvailabilityDaySnapshot) {
    const serviceById = new Map(
      snapshot.services.map((service) => [
        service.id,
        {
          ...service,
          startsToStaffIds: new Map(service.availableStaffIdsByStart),
        },
      ]),
    );
    const staffById = new Map(snapshot.staff.map((member) => [member.id, member]));
    const stepMin = snapshot.stepMin || 15;
    const bufferBeforeMin = snapshot.bufferBeforeMin ?? 0;
    const bufferAfterMin = snapshot.bufferAfterMin ?? 0;

    return {
      serviceById,
      staffById,
      stepMin,
      bufferBeforeMin,
      bufferAfterMin,
    };
  }

  private getSegmentDurationMin(params: {
    serviceDurationMin: number;
    bufferBeforeMin: number;
    bufferAfterMin: number;
    stepMin: number;
  }) {
    return this.roundToBlock(
      params.serviceDurationMin +
        params.bufferBeforeMin +
        params.bufferAfterMin,
      params.stepMin,
    );
  }

  private resolveManagerChainPlanFromSnapshot(params: {
    snapshot: AvailabilityDaySnapshot;
    pinnedStartIso: string;
    date: string;
    chain: { serviceId: string; staffId: string | 'ANY' }[];
  }) {
    const { snapshot, chain } = params;
    const ctx = this.createSnapshotContext(snapshot);
    const pinnedStartUtc = this.normalizeManagerChainStart({
      pinnedStartIso: params.pinnedStartIso,
      date: params.date,
      timezone: snapshot.timezone,
    });

    let cursorUtc = pinnedStartUtc;
    const assignments: {
      serviceId: string;
      staffId: string;
      startUtc: DateTime;
      endUtc: DateTime;
      durationMin: number;
      priceCents: number;
    }[] = [];

    for (const item of chain) {
      const service = ctx.serviceById.get(item.serviceId);
      if (!service) {
        throw new BadRequestException(`Service not found: ${item.serviceId}`);
      }

      const startMs = cursorUtc.toMillis();
      const eligibleStaffIds = service.startsToStaffIds.get(startMs) ?? [];

      if (!eligibleStaffIds.length) {
        throw new BadRequestException('No staff available for this timeslot');
      }

      const finalStaffId =
        item.staffId === 'ANY'
          ? eligibleStaffIds[0]
          : eligibleStaffIds.includes(item.staffId)
            ? item.staffId
            : null;

      if (!finalStaffId) {
        throw new BadRequestException('Timeslot already booked');
      }

      const durationMin = this.getSegmentDurationMin({
        serviceDurationMin: service.durationMin,
        bufferBeforeMin: ctx.bufferBeforeMin,
        bufferAfterMin: ctx.bufferAfterMin,
        stepMin: ctx.stepMin,
      });
      const endUtc = cursorUtc.plus({ minutes: durationMin }).set({
        millisecond: 0,
        second: 0,
      });

      assignments.push({
        serviceId: service.id,
        staffId: finalStaffId,
        startUtc: cursorUtc,
        endUtc,
        durationMin,
        priceCents: service.priceCents,
      });

      cursorUtc = endUtc;
    }

    return assignments;
  }

  async createPublicBooking(dto: CreatePublicBookingDto, publicUserId: string) {
    async function getOrCreateClientForPublicUser(params: {
      tx: any;
      publicUser: typeof publicUsers.$inferSelect;
      branch: {
        id: string;
        organizationId: string;
      };
    }) {
      const { tx, publicUser, branch } = params;

      const existingLink = await tx.query.publicUserClients.findFirst({
        where: eq(publicUserClients.publicUserId, publicUser.id),
        with: { client: true },
      });

      if (existingLink?.client?.organizationId === branch.organizationId) {
        return existingLink.client.id;
      }

      const [createdClient] = await tx
        .insert(clients)
        .values({
          organizationId: branch.organizationId,
          name: publicUser.name ?? 'Cliente',
          email: publicUser.email ?? null,
          phone: publicUser.phoneE164 ?? null,
          avatarUrl: publicUser.avatarUrl ?? null,
        })
        .returning({ id: clients.id });

      await tx.insert(publicUserClients).values({
        publicUserId: publicUser.id,
        clientId: createdClient.id,
      });

      return createdClient.id;
    }

    const { branchSlug, appointments: drafts } = dto;

    if (!drafts?.length) {
      throw new BadRequestException('appointments is required');
    }

    const publicUser = await this.db.query.publicUsers.findFirst({
      where: eq(publicUsers.id, publicUserId),
    });

    if (!publicUser) {
      throw new ForbiddenException('Public user not found');
    }

    if (!publicUser.phoneE164 || publicUser.phoneE164.trim().length < 8) {
      throw new ForbiddenException({
        code: 'PHONE_REQUIRED',
        message: 'Phone number is required to create an appointment',
      });
    }

    const branch = await this.publicBranchCache.getBySlug(branchSlug);

    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    const settings = await this.branchSettingsCache.get(branch.id);

    const tz = settings.timezone;
    const bufferBefore = settings.bufferBeforeMin;
    const bufferAfter = settings.bufferAfterMin;

    const BLOCK_MINUTES = 15;

    if (drafts.some((a) => a.staffId === 'ANY')) {
      throw new BadRequestException(
        'staffId cannot be ANY in final booking payload',
      );
    }

    const bookingId = randomUUID();

    const requestedServiceIds = [...new Set(drafts.map((draft) => draft.serviceId))];
    const requestedStaffIds = [...new Set(drafts.map((draft) => draft.staffId))];
    const servicesMap = await this.branchServicesCache.getActiveMap(branch.id);
    const staffMap = await this.branchStaffCache.getActiveMap(branch.id);

    for (const serviceId of requestedServiceIds) {
      if (!servicesMap.has(serviceId)) {
        throw new BadRequestException(`Service not found: ${serviceId}`);
      }
    }

    for (const staffId of requestedStaffIds) {
      if (!staffMap.has(staffId)) {
        throw new BadRequestException(`Staff not found: ${staffId}`);
      }
    }

    const normalized = drafts.map((a) => {
        const service = servicesMap.get(a.serviceId);
        const staffRow = staffMap.get(a.staffId);

        if (!staffRow) {
          throw new BadRequestException(`Staff not found: ${a.staffId}`);
        }

        if (!service) {
          throw new BadRequestException(`Service not found: ${a.serviceId}`);
        }

        const startLocal = DateTime.fromISO(a.startIso).set({
          millisecond: 0,
          second: 0,
        });

        if (!startLocal.isValid) {
          throw new BadRequestException('Invalid startIso');
        }

        const startInBranchTz = startLocal.setZone(tz);
        if (startInBranchTz.toISODate() !== dto.date) {
          throw new BadRequestException(
            `startIso does not match date ${dto.date}`,
          );
        }

        const totalMinutes = service.durationMin + bufferBefore + bufferAfter;

        const roundedMinutes =
          Math.ceil(totalMinutes / BLOCK_MINUTES) * BLOCK_MINUTES;

        const startUtc = startLocal.toUTC();
        const endUtc = startUtc.plus({ minutes: roundedMinutes }).set({
          millisecond: 0,
          second: 0,
        });

        return {
          publicBookingId: bookingId,
          branchId: branch.id,
          serviceId: service.id,
          staffId: a.staffId,
          startUtc,
          endUtc,
          priceCents: service.priceCents,
          notes: dto.notes ?? null,
          serviceName: service.name,
        };
      });

    normalized.sort((x, y) =>
      x.startUtc.toISO()!.localeCompare(y.startUtc.toISO()),
    );

    // 🔒 VALIDATE LOCKS
    for (const a of normalized) {
      const startIso = a.startUtc.toISO()!;
      const endIso = a.endUtc.toISO()!;

      const owners = await this.slotLock.getRangeOwners({
        branchId: a.branchId,
        staffId: a.staffId,
        startIso,
        endIso,
      });

      if (!owners.length) {
        throw new BadRequestException('Slot lock not found or expired');
      }

      if (!owners.every((o) => o === dto.ownerToken)) {
        throw new BadRequestException('Slot locked by another user');
      }
    }

    // validate chain continuity
    for (let i = 1; i < normalized.length; i++) {
      const prev = normalized[i - 1];
      const curr = normalized[i];

      if (prev.endUtc.toISO() !== curr.startUtc.toISO()) {
        throw new BadRequestException(
          'appointments must be consecutive without gaps',
        );
      }
    }

    const bookingStartsAtUtc = normalized[0].startUtc.toJSDate();
    const bookingEndsAtUtc =
      normalized[normalized.length - 1].endUtc.toJSDate();

    const bookingTotalCents = normalized.reduce(
      (acc, a) => acc + (a.priceCents ?? 0),
      0,
    );

    let couponDiscount = 0;
    let couponId: string | null = null;

    if (dto.discountCode) {
      const serviceIds = normalized.map((a) => a.serviceId);
      type CouponExecuteInput = Parameters<
        ValidateCouponUseCase['execute']
      >[0] & {
        serviceItems?: Array<{
          serviceId: string;
          amountCents: number;
        }>;
      };

      const couponInput: CouponExecuteInput = {
        code: dto.discountCode,
        branchId: branch.id,
        amountCents: bookingTotalCents,
        publicUserId,
        serviceIds,
        serviceItems: normalized.map((a) => ({
          serviceId: a.serviceId,
          amountCents: a.priceCents ?? 0,
        })),
      };
      const result = await this.validateCoupon.execute(couponInput);

      couponDiscount = result.discountCents;
      couponId = result.couponId;
    }

    // =========================
    // TRANSACTION
    // =========================

    let result: {
      ok: true;
      bookingId: string;
      branchSlug: string;
      date: string;
      paymentMethod: CreatePublicBookingDto['paymentMethod'];
      discountCode: string | null;
      notes: string | null;
      clientId: string;
      appointments: (typeof appointments.$inferSelect)[];
    };

    try {
      result = await this.db.transaction(async (tx) => {
        const clientId = await getOrCreateClientForPublicUser({
          tx,
          publicUser,
          branch,
        });

        const subtotal = bookingTotalCents;
        const afterCoupon = Math.max(subtotal - couponDiscount, 0);

        let giftCardUsed = 0;

        if (dto.giftCardCode && dto.giftCardAmountCents) {
          const giftCard = await tx.query.giftCards.findFirst({
            where: eq(giftCards.code, dto.giftCardCode),
          });

          if (!giftCard) {
            throw new BadRequestException('Gift card not found');
          }

          if (giftCard.branchId !== branch.id) {
            throw new ForbiddenException(
              'Gift card no pertenece a esta sucursal',
            );
          }

          if (giftCard.status !== 'active') {
            throw new BadRequestException('Gift card no válida');
          }

          if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
            throw new BadRequestException('Gift card expirada');
          }

          if (giftCard.balanceCents < dto.giftCardAmountCents) {
            throw new BadRequestException('Saldo insuficiente');
          }

          // 🔥 ahora sí correcto
          giftCardUsed = Math.min(dto.giftCardAmountCents, afterCoupon);

          const newBalance = giftCard.balanceCents - giftCardUsed;

          await tx
            .update(giftCards)
            .set({
              balanceCents: newBalance,
              updatedAt: new Date(),
            })
            .where(eq(giftCards.id, giftCard.id));

          await tx.insert(giftCardTransactions).values({
            giftCardId: giftCard.id,
            type: 'redeem',
            amountCents: giftCardUsed,
            referenceType: 'booking',
            referenceId: bookingId,
            createdAt: new Date(),
          });
        }

        const finalTotal = Math.max(afterCoupon - giftCardUsed, 0);

        await tx.insert(publicBookings).values({
          id: bookingId,
          branchId: branch.id,
          publicUserId,
          startsAt: bookingStartsAtUtc,
          endsAt: bookingEndsAtUtc,
          status: 'CONFIRMED',
          paymentMethod: (dto.paymentMethod ?? 'ONSITE') as 'ONSITE' | 'ONLINE',
          paidWithGiftCardCents: giftCardUsed,
          subtotalCents: subtotal,
          discountCents: couponDiscount,
          couponId: couponId,
          remainingToPayCents: finalTotal,
          totalCents: finalTotal,
          notes: dto.notes ?? null,
        });

        if (couponId) {
          // Same transaction/connection to avoid lock waits on coupons row.
          await tx
            .update(coupons)
            .set({
              usedCount: sql`${coupons.usedCount} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(coupons.id, couponId));
        }

        let created: (typeof appointments.$inferSelect)[];
        try {
          created = await tx
            .insert(appointments)
            .values(
              normalized.map((a) => ({
                publicBookingId: a.publicBookingId,
                publicUserId,
                clientId,
                branchId: a.branchId,
                staffId: a.staffId,
                serviceId: a.serviceId,
                start: a.startUtc.toJSDate(),
                end: a.endUtc.toJSDate(),
                status: 'CONFIRMED' as const,
                paymentStatus:
                  dto.paymentMethod === PublicPaymentMethodEnum.ONLINE
                    ? ('PAID' as const)
                    : ('UNPAID' as const),
                notes: a.notes,
                priceCents: a.priceCents,
              })),
            )
            .returning();
        } catch (e: any) {
          if (e?.code === '23P01') {
            throw new BadRequestException('Timeslot already booked');
          }

          throw e;
        }

        await tx.insert(appointmentStatusHistory).values(
          created.map((row) => ({
            appointmentId: row.id,
            newStatus: 'CONFIRMED',
            reason: 'Public booking',
          })),
        );

        return {
          ok: true as const,
          bookingId,
          branchSlug: dto.branchSlug,
          date: dto.date,
          paymentMethod: dto.paymentMethod,
          discountCode: dto.discountCode ?? null,
          notes: dto.notes ?? null,
          clientId,
          appointments: created,
        };
      });
    } catch (e: any) {
      // 🔥 fallback global (por si no cayó en el catch interno)
      if (e?.code === '23P01') {
        throw new BadRequestException('Timeslot already booked');
      }

      throw e;
    } finally {
      await Promise.allSettled(
        normalized.map((a) =>
          this.slotLock.releaseRange({
            branchId: a.branchId,
            staffId: a.staffId,
            startIso: a.startUtc.toISO()!,
            endIso: a.endUtc.toISO()!,
            ownerToken: dto.ownerToken,
          }),
        ),
      );
    }

    // =========================
    // JOBS OUTSIDE TRANSACTION
    // =========================

    await this.publicBookingJobsService.scheduleBookingLifecycle({
      bookingId,
      startsAtUtc: bookingStartsAtUtc,
      endsAtUtc: bookingEndsAtUtc,
    });

    // =========================
    // 🔔 BUILD NOTIFICATION DATA (READ ONLY)
    // =========================
    const staffUserIds = [
      ...new Set(
        requestedStaffIds
          .map((staffId) => staffMap.get(staffId)?.userId)
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    const staffMembers =
      staffUserIds.length > 0
        ? await this.db
            .select({
              id: users.id,
              name: users.name,
              avatarUrl: users.avatarUrl,
            })
            .from(users)
            .where(inArray(users.id, staffUserIds))
        : [];

    await this.notificationsJobService.bookingCreated({
      bookingId,
      branchId: branch.id,

      schedule: {
        startsAt: bookingStartsAtUtc,
        endsAt: bookingEndsAtUtc,
      },

      services: requestedServiceIds.map((serviceId) => {
        const service = servicesMap.get(serviceId)!;
        return {
          id: service.id,
          name: service.name,
          durationMin: service.durationMin,
          priceCents: service.priceCents ?? 0,
        };
      }),

      client: result.clientId
        ? {
            id: result.clientId,
            name: publicUser.name ?? 'Cliente',
            avatarUrl: publicUser.avatarUrl ?? null,
          }
        : undefined,

      staff: staffMembers.map((s) => ({
        id: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl,
      })),

      totalCents: bookingTotalCents,
    });

    await this.calendarRealtime.emitInvalidate({
      branchId: branch.id,
      reason: 'booking.created',
    });

    if (bookingStartsAtUtc) {
      const branchDate = DateTime.fromJSDate(bookingStartsAtUtc, {
        zone: 'utc',
      })
        .setZone(settings.timezone)
        .toISODate();
      if (branchDate) {
        await this.availabilityCache.invalidate(branch.id, branchDate);
        await this.availabilityWarm.enqueueDay({
          branchId: branch.id,
          date: branchDate,
        });
      } else {
        await this.availabilityCache.invalidate(branch.id);
      }
    } else {
      await this.availabilityCache.invalidate(branch.id);
    }
    await this.paymentBenefitsRefresh.enqueueUserRefresh({
      branchId: branch.id,
      publicUserId,
    });

    return result;
  }

  async getPublicBookingById(params: {
    bookingId: string;
    publicUserId: string;
  }) {
    const { bookingId, publicUserId } = params;

    if (!bookingId) throw new BadRequestException('bookingId is required');
    if (!publicUserId) throw new ForbiddenException('Not authenticated');

    const [booking] = (await this.db.execute(sql`
      SELECT
        pb.id,
        pb.status,
        pb.starts_at as "startsAt",
        pb.ends_at as "endsAt",
        pb.payment_method as "paymentMethod",
        pb.notes,
        pb.total_cents as "totalCents",
        b.id as "branchId",
        b.name as "branchName",
        b.public_slug as "branchSlug",
        b.address as "branchAddress",
        (
          SELECT bi.url
          FROM branch_images bi
          WHERE bi.branch_id = b.id
          ORDER BY bi.is_cover DESC, bi.position ASC NULLS LAST, bi.created_at ASC
          LIMIT 1
        ) as "imageUrl",
        bs.timezone,
        COALESCE(bs.cancelation_window_min, 120) as "cancelationWindowMin",
        COALESCE(bs.reschedule_window_min, 480) as "rescheduleWindowMin",
        pbr.rating as "ratingValue",
        pbr.comment as "ratingComment",
        pbr.created_at as "ratingCreatedAt",
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', a.id,
              'status', a.status,
              'startUtc', a.start,
              'endUtc', a."end",
              'priceCents', a.price_cents,
              'service', json_build_object(
                'id', s.id,
                'name', s.name
              ),
              'staff', json_build_object(
                'id', st.id,
                'name', st.name,
                'avatarUrl', st.avatar_url
              )
            )
            ORDER BY a.start ASC
          )
          FROM appointments a
          INNER JOIN services s ON s.id = a.service_id
          INNER JOIN staff st ON st.id = a.staff_id
          WHERE a.public_booking_id = pb.id
        ), '[]'::json) as appointments
      FROM public_bookings pb
      INNER JOIN branches b ON b.id = pb.branch_id
      LEFT JOIN branch_settings bs ON bs.branch_id = b.id
      LEFT JOIN public_booking_ratings pbr ON pbr.booking_id = pb.id
      WHERE pb.id = ${bookingId}
        AND pb.public_user_id = ${publicUserId}
        AND b.public_presence_enabled = true
      LIMIT 1
    `)) as Array<{
      id: string;
      status: string;
      startsAt: Date;
      endsAt: Date;
      paymentMethod: string | null;
      notes: string | null;
      totalCents: number | null;
      branchId: string;
      branchName: string;
      branchSlug: string | null;
      branchAddress: string | null;
      imageUrl: string | null;
      timezone: string | null;
      cancelationWindowMin: number | null;
      rescheduleWindowMin: number | null;
      ratingValue: number | null;
      ratingComment: string | null;
      ratingCreatedAt: Date | null;
      appointments:
        | Array<{
            id: string;
            status: string;
            startUtc: string;
            endUtc: string;
            priceCents: number | null;
            service: { id: string; name: string };
            staff: { id: string; name: string; avatarUrl: string | null };
          }>
        | string
        | null;
    }>;

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const tz = booking.timezone ?? 'America/Mexico_City';
    const appointmentsPayload = parseJsonArray<PublicBookingAppointmentRow>(
      booking.appointments,
    ).map((appointment) => {
      const startUtc = DateTime.fromISO(String(appointment.startUtc), {
        zone: 'utc',
      });
      const endUtc = DateTime.fromISO(String(appointment.endUtc), {
        zone: 'utc',
      });

      return {
        id: appointment.id,
        status: appointment.status,
        startIso: startUtc.setZone(tz).toISO()!,
        endIso: endUtc.setZone(tz).toISO()!,
        durationMin: Math.round(endUtc.diff(startUtc, 'minutes').minutes),
        priceCents: appointment.priceCents ?? 0,
        service: appointment.service,
        staff: {
          ...appointment.staff,
          avatarUrl: appointment.staff.avatarUrl ?? null,
        },
      };
    });

    if (!appointmentsPayload.length) {
      throw new NotFoundException('Booking not found');
    }

    const bookingDate = DateTime.fromJSDate(booking.startsAt, { zone: 'utc' })
      .setZone(tz)
      .toISODate();

    return {
      ok: true,
      booking: {
        id: bookingId,
        status: booking.status,
        startsAtISO: DateTime.fromJSDate(booking.startsAt, {
          zone: 'utc',
        }).toISO()!,
        endsAtISO: DateTime.fromJSDate(booking.endsAt, {
          zone: 'utc',
        }).toISO()!,
        rating: booking.ratingValue !== null
          ? {
              value: booking.ratingValue,
              comment: booking.ratingComment ?? null,
              createdAt: booking.ratingCreatedAt
                ? booking.ratingCreatedAt.toISOString()
                : null,
            }
          : null,

        branch: {
          id: booking.branchId,
          slug: booking.branchSlug,
          name: booking.branchName,
          address: booking.branchAddress ?? '',
          imageUrl: booking.imageUrl,
        },

        policies: {
          cancelationWindowMin: booking.cancelationWindowMin ?? 120,
          rescheduleWindowMin: booking.rescheduleWindowMin ?? 480,
        },
        date: bookingDate,
        paymentMethod: booking.paymentMethod,
        notes: booking.notes ?? null,
        totalCents: booking.totalCents,
        appointments: appointmentsPayload,
      },
    };
  }

  async setPhone(params: { publicUserId: string; phoneE164: string }) {
    const { publicUserId, phoneE164 } = params;

    if (!phoneE164 || !phoneE164.startsWith('+')) {
      throw new BadRequestException(
        'phoneE164 must be in E.164 format, example: +5213312345678',
      );
    }

    await this.db
      .update(publicUsers)
      .set({ phoneE164 })
      .where(eq(publicUsers.id, publicUserId));

    return { ok: true };
  }
  //manager
  async createManagerBooking(dto: {
    branchId: string;
    clientId?: string | null;
    date: string;
    notes?: string | null;
    appointments: {
      serviceId: string;
      staffId: string;
      startIso: string;
    }[];
  }) {
    const { branchId, clientId, appointments: drafts } = dto;

    if (!branchId) throw new BadRequestException('branchId is required');
    if (!drafts?.length)
      throw new BadRequestException('appointments is required');

    // 1) Branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });
    if (!branch) throw new NotFoundException('Branch not found');

    // 2) Settings
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branch.id),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';
    const bufferBefore = settings?.bufferBeforeMin ?? 0;
    const bufferAfter = settings?.bufferAfterMin ?? 0;
    const BLOCK_MINUTES = 15;

    // 3) Normalizar appointments
    const normalized = await Promise.all(
      drafts.map(async (a) => {
        const service = await this.db.query.services.findFirst({
          where: and(
            eq(services.id, a.serviceId),
            eq(services.branchId, branch.id),
            eq(services.isActive, true),
          ),
        });
        if (!service) {
          throw new BadRequestException(`Service not found: ${a.serviceId}`);
        }

        const startLocal = DateTime.fromISO(a.startIso).set({
          millisecond: 0,
          second: 0,
        });
        if (!startLocal.isValid) {
          throw new BadRequestException('Invalid startIso');
        }

        const startInBranchTz = startLocal.setZone(tz);
        if (startInBranchTz.toISODate() !== dto.date) {
          throw new BadRequestException(
            `startIso does not match date ${dto.date}`,
          );
        }

        const totalMinutes = service.durationMin + bufferBefore + bufferAfter;
        const roundedMinutes =
          Math.ceil(totalMinutes / BLOCK_MINUTES) * BLOCK_MINUTES;

        const startUtc = startLocal.toUTC();
        const endUtc = startUtc.plus({ minutes: roundedMinutes }).set({
          millisecond: 0,
          second: 0,
        });

        return {
          branchId: branch.id,
          serviceId: service.id,
          staffId: a.staffId,
          startUtc,
          endUtc,
          priceCents: service.priceCents,
        };
      }),
    );

    normalized.sort((a, b) =>
      a.startUtc.toISO()!.localeCompare(b.startUtc.toISO()),
    );

    for (let i = 1; i < normalized.length; i++) {
      if (normalized[i - 1].endUtc.toISO() !== normalized[i].startUtc.toISO()) {
        throw new BadRequestException(
          'appointments must be consecutive without gaps',
        );
      }
    }

    const bookingStartsAtUtc = normalized[0].startUtc.toJSDate();
    const bookingEndsAtUtc =
      normalized[normalized.length - 1].endUtc.toJSDate();
    const bookingTotalCents = normalized.reduce(
      (acc, a) => acc + (a.priceCents ?? 0),
      0,
    );

    // 🔑 BOOKING ID SIEMPRE
    const bookingId = randomUUID();

    // =========================
    // ✅ TRANSACTION
    // =========================
    const result = await this.db.transaction(async (tx) => {
      // A) Overlap check
      for (const a of normalized) {
        const overlapping = await tx
          .select()
          .from(appointments)
          .where(
            buildAppointmentOverlapWhere({
              branchId: a.branchId,
              staffId: a.staffId,
              startUtc: a.startUtc,
              endUtc: a.endUtc,
            }),
          );

        if (overlapping.length) {
          throw new BadRequestException('Timeslot already booked');
        }
      }

      // B) Resolver publicUserId (puede ser null)
      let publicUserId: string | null = null;
      if (clientId) {
        const link = await tx.query.publicUserClients.findFirst({
          where: eq(publicUserClients.clientId, clientId),
          columns: { publicUserId: true },
        });
        publicUserId = link?.publicUserId ?? null;
      }

      // C) 👉 CREAR BOOKING SIEMPRE
      await tx.insert(publicBookings).values({
        id: bookingId,
        branchId: branch.id,
        publicUserId,

        startsAt: bookingStartsAtUtc,
        endsAt: bookingEndsAtUtc,

        status: 'CONFIRMED',
        paymentMethod: 'ONSITE',

        // 🔥 NUEVO
        subtotalCents: bookingTotalCents,
        discountCents: 0,

        totalCents: bookingTotalCents,

        paidWithGiftCardCents: 0,
        remainingToPayCents: bookingTotalCents,

        notes: dto.notes ?? null,
      });

      // D) Insert appointments (siempre con bookingId)
      const created = await Promise.all(
        normalized.map(async (a) => {
          const [row] = await tx
            .insert(appointments)
            .values({
              branchId: a.branchId,
              staffId: a.staffId,
              serviceId: a.serviceId,
              start: a.startUtc.toJSDate(),
              end: a.endUtc.toJSDate(),
              status: 'CONFIRMED',
              paymentStatus: 'UNPAID',
              priceCents: a.priceCents,
              notes: dto.notes ?? null,

              clientId: clientId ?? null,
              publicUserId,
              publicBookingId: bookingId, // ✅ SIEMPRE
            })
            .returning();

          await tx.insert(appointmentStatusHistory).values({
            appointmentId: row.id,
            newStatus: 'CONFIRMED',
            reason: 'Manager booking',
          });

          return row;
        }),
      );

      return {
        ok: true,
        bookingId,
        publicBookingId: bookingId,
        publicUserId,
        clientId: clientId ?? null,
        appointments: created,
      };
    });

    // ⏱ Jobs SOLO si hay usuario público ligado
    if (result.publicUserId) {
      await this.publicBookingJobsService.scheduleBookingLifecycle({
        bookingId,
        startsAtUtc: bookingStartsAtUtc,
        endsAtUtc: bookingEndsAtUtc,
      });
    }

    await this.calendarRealtime.emitInvalidate({
      branchId: branch.id,
      reason: 'booking.created',
    });

    return result;
  }

  private roundToBlock(totalMinutes: number, blockMinutes = 15) {
    return Math.ceil(totalMinutes / blockMinutes) * blockMinutes;
  }

  private async getBranchAndSettings(branchId: string) {
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) throw new NotFoundException('Branch not found');

    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branch.id),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';
    const bufferBefore = settings?.bufferBeforeMin ?? 0;
    const bufferAfter = settings?.bufferAfterMin ?? 0;

    return { branch, settings, tz, bufferBefore, bufferAfter };
  }

  private async hasOverlap(params: {
    branchId: string;
    staffId: string;
    startUtc: DateTime;
    endUtc: DateTime;
  }) {
    const overlapping = await this.db
      .select({ id: appointments.id })
      .from(appointments)
      .where(buildAppointmentOverlapWhere(params));

    return overlapping.length > 0;
  }

  private async computeSegment(params: {
    branchId: string;
    tz: string;
    bufferBefore: number;
    bufferAfter: number;
    startUtc: DateTime;
    serviceId: string;
  }) {
    const { branchId, bufferBefore, bufferAfter, startUtc, serviceId } = params;

    const srv = await this.db.query.services.findFirst({
      where: and(
        eq(services.id, serviceId),
        eq(services.branchId, branchId),
        eq(services.isActive, true),
      ),
    });

    if (!srv) throw new BadRequestException(`Service not found: ${serviceId}`);

    const total = srv.durationMin + bufferBefore + bufferAfter;
    const rounded = this.roundToBlock(total, 15);

    const endUtc = startUtc.plus({ minutes: rounded }).set({
      millisecond: 0,
      second: 0,
    });

    return {
      service: srv,
      startUtc,
      endUtc,
      durationMin: rounded,
      priceCents: srv.priceCents ?? 0,
    };
  }

  async managerChainBuild(dto: {
    branchId: string;
    date: string;
    pinnedStartIso: string;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
  }) {
    const { branchId, date, pinnedStartIso, chain } = dto;

    if (!branchId) throw new BadRequestException('branchId is required');
    if (!date) throw new BadRequestException('date is required');
    if (!pinnedStartIso)
      throw new BadRequestException('pinnedStartIso is required');
    if (!chain?.length) throw new BadRequestException('chain is required');

    const cacheKey = this.buildManagerChainCacheKey({
      kind: 'build',
      branchId,
      date,
      pinnedStartIso,
      chain,
    });

    return this.getOrSetManagerChainCache(cacheKey, async () => {
      const snapshot = await this.getAvailabilityDaySnapshotStrict(
        branchId,
        date,
      );
      const assignments = this.resolveManagerChainPlanFromSnapshot({
        snapshot,
        pinnedStartIso,
        date,
        chain,
      });

      const totalMinutes = assignments.reduce(
        (acc, a) => acc + a.durationMin,
        0,
      );
      const totalCents = assignments.reduce(
        (acc, a) => acc + (a.priceCents ?? 0),
        0,
      );

      return {
        ok: true as const,
        plan: {
          startIso: assignments[0].startUtc.toISO()!,
          assignments: assignments.map((a) => ({
            serviceId: a.serviceId,
            staffId: a.staffId,
            startIso: a.startUtc.toISO()!,
            endIso: a.endUtc.toISO()!,
            durationMin: a.durationMin,
            priceCents: a.priceCents,
          })),
          totalMinutes,
          totalCents,
        },
      };
    });
  }

  async managerChainNextServices(dto: {
    branchId: string;
    date: string;
    pinnedStartIso: string;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
  }) {
    const { branchId, date, pinnedStartIso, chain } = dto;

    if (!branchId) throw new BadRequestException('branchId is required');
    if (!date) throw new BadRequestException('date is required');
    if (!pinnedStartIso)
      throw new BadRequestException('pinnedStartIso is required');

    const cacheKey = this.buildManagerChainCacheKey({
      kind: 'next-services',
      branchId,
      date,
      pinnedStartIso,
      chain,
    });

    return this.getOrSetManagerChainCache(cacheKey, async () => {
      const snapshot = await this.getAvailabilityDaySnapshotOrWarm(branchId, date);
      const existingAssignments = chain.length
        ? this.resolveManagerChainPlanFromSnapshot({
            snapshot,
            pinnedStartIso,
            date,
            chain,
          })
        : [];
      const cursorMs = existingAssignments.length
        ? existingAssignments[existingAssignments.length - 1].endUtc.toMillis()
        : this.normalizeManagerChainStart({
            pinnedStartIso,
            date,
            timezone: snapshot.timezone,
          }).toMillis();

      const nextServices = snapshot.services.flatMap((service) => {
        const availableStaffIds = service.availableStaffIdsByStart.find(
          ([startMs]) => startMs === cursorMs,
        )?.[1];

        if (!availableStaffIds?.length) {
          return [];
        }

        return [
          {
            id: service.id,
            name: service.name,
            durationMin: service.durationMin,
            priceCents: service.priceCents ?? 0,
            categoryColor: service.categoryColor ?? null,
          },
        ];
      });

      return {
        ok: true as const,
        nextServices,
      };
    });
  }

  async managerChainNextStaffOptions(dto: {
    branchId: string;
    date: string;
    pinnedStartIso: string;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
    nextServiceId: string;
  }) {
    const { branchId, nextServiceId } = dto;

    if (!branchId) throw new BadRequestException('branchId is required');
    if (!nextServiceId)
      throw new BadRequestException('nextServiceId is required');
    if (!dto.date) throw new BadRequestException('date is required');
    if (!dto.pinnedStartIso)
      throw new BadRequestException('pinnedStartIso is required');

    const cacheKey = this.buildManagerChainCacheKey({
      kind: 'next-staff-options',
      branchId,
      date: dto.date,
      pinnedStartIso: dto.pinnedStartIso,
      chain: dto.chain,
      nextServiceId,
    });

    return this.getOrSetManagerChainCache(cacheKey, async () => {
      const snapshot = await this.getAvailabilityDaySnapshotOrWarm(
        branchId,
        dto.date,
      );
      const ctx = this.createSnapshotContext(snapshot);
      const existingAssignments = dto.chain.length
        ? this.resolveManagerChainPlanFromSnapshot({
            snapshot,
            pinnedStartIso: dto.pinnedStartIso,
            date: dto.date,
            chain: dto.chain,
          })
        : [];
      const cursorMs = existingAssignments.length
        ? existingAssignments[existingAssignments.length - 1].endUtc.toMillis()
        : this.normalizeManagerChainStart({
            pinnedStartIso: dto.pinnedStartIso,
            date: dto.date,
            timezone: snapshot.timezone,
          }).toMillis();

      const service = ctx.serviceById.get(nextServiceId);
      if (!service) {
        throw new BadRequestException(`Service not found: ${nextServiceId}`);
      }

      const availableStaffIds = service.startsToStaffIds.get(cursorMs) ?? [];
      const available = availableStaffIds
        .map((staffId) => ctx.staffById.get(staffId))
        .filter(
          (
            member,
          ): member is {
            id: string;
            name: string;
            avatarUrl: string | null;
          } => Boolean(member),
        )
        .map((member) => ({
          id: member.id,
          name: member.name,
          avatarUrl: member.avatarUrl ?? null,
        }));

      return {
        ok: true as const,
        allowAny: available.length > 1,
        staff: available,
      };
    });
  }

  async getManagerBookingById(params: { bookingId: string }) {
    const { bookingId } = params;

    if (!bookingId) {
      throw new BadRequestException('bookingId is required');
    }

    const [booking] = (await this.db.execute(sql`
      SELECT
        pb.id,
        pb.status,
        pb.starts_at as "startsAt",
        pb.ends_at as "endsAt",
        b.id as "branchId",
        b.name as "branchName",
        bs.timezone,
        c.id as "clientId",
        c.name as "clientName",
        c.phone as "clientPhone",
        c.email as "clientEmail",
        COALESCE(c.avatar_url, pu.avatar_url) as "clientAvatarUrl",
        CASE WHEN pu.id IS NULL THEN false ELSE true END as "hasPublicUser",
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', a.id,
              'status', a.status,
              'paymentStatus', a.payment_status,
              'startUtc', a.start,
              'endUtc', a."end",
              'priceCents', a.price_cents,
              'service', json_build_object(
                'id', s.id,
                'name', s.name,
                'categoryColor', COALESCE(sc.color_hex, '#A78BFA')
              ),
              'staff', json_build_object(
                'id', st.id,
                'name', st.name,
                'avatarUrl', st.avatar_url
              )
            )
            ORDER BY a.start ASC
          )
          FROM appointments a
          INNER JOIN services s ON s.id = a.service_id
          LEFT JOIN service_categories sc ON sc.id = s.category_id
          INNER JOIN staff st ON st.id = a.staff_id
          WHERE a.public_booking_id = pb.id
        ), '[]'::json) as appointments
      FROM public_bookings pb
      INNER JOIN branches b ON b.id = pb.branch_id
      LEFT JOIN branch_settings bs ON bs.branch_id = b.id
      LEFT JOIN clients c ON c.id = (
        SELECT a.client_id
        FROM appointments a
        WHERE a.public_booking_id = pb.id
        LIMIT 1
      )
      LEFT JOIN public_user_clients puc ON puc.client_id = c.id
      LEFT JOIN public_users pu ON pu.id = puc.public_user_id
      WHERE pb.id = ${bookingId}
      LIMIT 1
    `)) as Array<{
      id: string;
      status: string;
      startsAt: Date;
      endsAt: Date;
      branchId: string;
      branchName: string;
      timezone: string | null;
      clientId: string | null;
      clientName: string | null;
      clientPhone: string | null;
      clientEmail: string | null;
      clientAvatarUrl: string | null;
      hasPublicUser: boolean;
      appointments:
        | Array<{
            id: string;
            status: string;
            paymentStatus: string;
            startUtc: string;
            endUtc: string;
            priceCents: number | null;
            service: { id: string; name: string; categoryColor: string };
            staff: { id: string; name: string; avatarUrl: string | null };
          }>
        | string
        | null;
    }>;

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const tz = booking.timezone ?? 'America/Mexico_City';
    const appointmentPayload = parseJsonArray<ManagerBookingAppointmentRow>(
      booking.appointments,
    ).map((appointment) => {
      const startUtc = DateTime.fromISO(String(appointment.startUtc), {
        zone: 'utc',
      });
      const endUtc = DateTime.fromISO(String(appointment.endUtc), {
        zone: 'utc',
      });

      return {
        id: appointment.id,
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
        startIso: startUtc.setZone(tz).toISO()!,
        endIso: endUtc.setZone(tz).toISO()!,
        durationMin: Math.round(endUtc.diff(startUtc, 'minutes').minutes),
        priceCents: appointment.priceCents ?? 0,
        service: appointment.service,
        staff: {
          ...appointment.staff,
          avatarUrl: appointment.staff.avatarUrl ?? null,
        },
      };
    });

    if (!appointmentPayload.length) {
      throw new NotFoundException('Booking not found');
    }

    const bookingDate = DateTime.fromJSDate(booking.startsAt, { zone: 'utc' })
      .setZone(tz)
      .toISODate();

    // ✅ RESPONSE FINAL
    return {
      ok: true,
      booking: {
        id: bookingId,
        status: booking.status,
        date: bookingDate,
        startsAtISO: DateTime.fromJSDate(booking.startsAt, {
          zone: 'utc',
        }).toISO()!,
        endsAtISO: DateTime.fromJSDate(booking.endsAt, {
          zone: 'utc',
        }).toISO()!,
        branch: {
          id: booking.branchId,
          name: booking.branchName,
        },
        client: booking.clientId
          ? {
              id: booking.clientId,
              name: booking.clientName,
              phone: booking.clientPhone,
              email: booking.clientEmail,
              avatarUrl: booking.clientAvatarUrl,
              hasPublicUser: booking.hasPublicUser,
            }
          : null,
        paymentStatus: appointmentPayload.every((a) => a.paymentStatus === 'PAID')
          ? 'PAID'
          : 'UNPAID',
        totalCents: appointmentPayload.reduce(
          (acc, appointment) => acc + (appointment.priceCents ?? 0),
          0,
        ),
        appointments: appointmentPayload,
      },
    };
  }

  async assignClientToBooking(params: { bookingId: string; clientId: string }) {
    const { bookingId, clientId } = params;

    if (!bookingId) throw new BadRequestException('bookingId is required');
    if (!clientId) throw new BadRequestException('clientId is required');

    return this.db.transaction(async (tx) => {
      /* =========================
       1️⃣ Booking
    ========================= */

      const booking = await tx.query.publicBookings.findFirst({
        where: eq(publicBookings.id, bookingId),
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.publicUserId) {
        throw new BadRequestException(
          'Booking already has a public user assigned',
        );
      }

      /* =========================
       2️⃣ Resolver publicUserId (opcional)
    ========================= */

      const link = await tx.query.publicUserClients.findFirst({
        where: eq(publicUserClients.clientId, clientId),
        columns: { publicUserId: true },
      });

      const publicUserId = link?.publicUserId ?? null;

      /* =========================
       3️⃣ Actualizar booking
    ========================= */

      if (publicUserId) {
        await tx
          .update(publicBookings)
          .set({ publicUserId })
          .where(eq(publicBookings.id, bookingId));
      }

      /* =========================
       4️⃣ Actualizar appointments
    ========================= */

      await tx
        .update(appointments)
        .set({
          clientId,
          ...(publicUserId ? { publicUserId } : {}),
        })
        .where(eq(appointments.publicBookingId, bookingId));

      /* =========================
       5️⃣ SINCRONIZAR PAYMENT
    ========================= */

      const payment = await tx.query.payments.findFirst({
        where: and(
          eq(payments.bookingId, bookingId),
          eq(payments.status, 'pending'),
        ),
        columns: { id: true },
      });

      if (payment) {
        await tx
          .update(payments)
          .set({ clientId })
          .where(eq(payments.id, payment.id));
      }

      /* =========================
       6️⃣ Schedule lifecycle jobs
       SOLO si existe public user
    ========================= */

      if (publicUserId) {
        await this.publicBookingJobsService.scheduleBookingLifecycle({
          bookingId,
          startsAtUtc: booking.startsAt,
          endsAtUtc: booking.endsAt,
        });
      }

      /* =========================
       RESPONSE
    ========================= */

      return {
        ok: true,
        bookingId,
        clientId,
        publicUserId,
        hasPublicUser: !!publicUserId,
      };
    });
  }

  async cancelBooking(params: {
    bookingId: string;
    cancelledBy: 'PUBLIC' | 'MANAGER';
    reason?: string;
  }) {
    const { bookingId, cancelledBy, reason } = params;

    if (!bookingId) {
      throw new BadRequestException('bookingId is required');
    }

    const nowUtc = DateTime.utc();

    // =========================
    // ✅ DB TRANSACTION ONLY
    // =========================
    const result = await this.db.transaction(async (tx) => {
      const booking = await tx.query.publicBookings.findFirst({
        where: eq(publicBookings.id, bookingId),
      });

      if (!booking) throw new NotFoundException('Booking not found');

      if (booking.status === 'CANCELLED') {
        throw new BadRequestException('Booking already cancelled');
      }

      if (booking.status === 'COMPLETED') {
        throw new BadRequestException('Completed booking cannot be cancelled');
      }

      const startsAtUtc = DateTime.fromJSDate(booking.startsAt).toUTC();

      if (startsAtUtc <= nowUtc) {
        throw new BadRequestException(
          'Booking already started and cannot be cancelled',
        );
      }

      // ============================
      // 🔒 CANCELLATION POLICY CHECK
      // ============================

      const branchSettingsRow = await tx.query.branchSettings.findFirst({
        where: eq(branchSettings.branchId, booking.branchId),
      });

      const cancelationWindowMin =
        branchSettingsRow?.cancelationWindowMin ?? 120; // fallback 2h

      const diffMinutes = startsAtUtc.diff(nowUtc, 'minutes').minutes;

      if (cancelledBy === 'PUBLIC') {
        if (diffMinutes < cancelationWindowMin) {
          throw new BadRequestException(
            `This booking cannot be cancelled less than ${
              cancelationWindowMin / 60
            } hours before start time`,
          );
        }
      }

      await tx
        .update(publicBookings)
        .set({ status: 'CANCELLED', updatedAt: new Date() })
        .where(eq(publicBookings.id, bookingId));

      const affectedAppointments = await tx
        .update(appointments)
        .set({ status: 'CANCELLED', updatedAt: new Date() })
        .where(eq(appointments.publicBookingId, bookingId))
        .returning({
          id: appointments.id,
          serviceId: appointments.serviceId,
          staffId: appointments.staffId,
          clientId: appointments.clientId,
          priceCents: appointments.priceCents,
        });

      for (const a of affectedAppointments) {
        await tx.insert(appointmentStatusHistory).values({
          appointmentId: a.id,
          newStatus: 'CANCELLED',
          reason:
            reason ??
            (cancelledBy === 'PUBLIC'
              ? 'Cancelled by client'
              : 'Cancelled by manager'),
        });
      }

      return {
        booking,
        affectedAppointments,
      };
    });

    // =========================
    // ✅ SIDE EFFECTS (OUTSIDE TX)
    // =========================

    await this.publicBookingJobsService.cancelScheduledJobs(bookingId);

    await this.publicBookingJobsService.scheduleCancellationMail({
      bookingId,
      cancelledBy,
    });

    // =========================
    // 🔔 BUILD NOTIFICATION DATA
    // =========================

    const { booking, affectedAppointments } = result;

    // 1️⃣ Servicios usados
    const serviceIds = [
      ...new Set(affectedAppointments.map((a) => a.serviceId)),
    ];

    const servicesUsed = await this.db
      .select({
        id: services.id,
        name: services.name,
        durationMin: services.durationMin,
        priceCents: services.priceCents,
      })
      .from(services)
      .where(inArray(services.id, serviceIds));

    // 2️⃣ Staff
    const staffIds = [...new Set(affectedAppointments.map((a) => a.staffId))];

    const staffMembers = await this.db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(inArray(users.id, staffIds));

    // 3️⃣ Cliente (desde appointment, NO desde booking)
    const firstClientId = affectedAppointments[0]?.clientId;

    const client = firstClientId
      ? await this.db.query.clients.findFirst({
          where: eq(clients.id, firstClientId),
        })
      : null;

    // 4️⃣ Total
    const totalCents = affectedAppointments.reduce(
      (acc, a) => acc + (a.priceCents ?? 0),
      0,
    );

    // =========================
    // 🔔 CREATE NOTIFICATION
    // =========================

    await this.notificationsJobService.bookingCancelled({
      bookingId,
      branchId: booking.branchId,

      schedule: {
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
      },

      services: servicesUsed.map((s) => ({
        id: s.id,
        name: s.name,
        durationMin: s.durationMin,
        priceCents: s.priceCents ?? 0,
      })),

      client: client
        ? {
            id: client.id,
            name: client.name,
            avatarUrl: client.avatarUrl,
          }
        : undefined,

      staff: staffMembers.map((s) => ({
        id: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl,
      })),

      totalCents,
      cancelledBy,
    });

    await this.calendarRealtime.emitInvalidate({
      branchId: booking.branchId,
      reason: 'booking.cancelled',
    });

    const cancelledDate = DateTime.fromJSDate(booking.startsAt, {
      zone: 'utc',
    })
      .setZone(await this.branchSettingsCache.getTimezone(booking.branchId))
      .toISODate();
    if (cancelledDate) {
      await this.availabilityCache.invalidate(booking.branchId, cancelledDate);
      await this.availabilityWarm.enqueueDay({
        branchId: booking.branchId,
        date: cancelledDate,
      });
    } else {
      await this.availabilityCache.invalidate(booking.branchId);
    }

    return {
      ok: true,
      bookingId,
      cancelledBy,
      cancelledAppointments: affectedAppointments.length,
    };
  }
  async rescheduleBookingCore(params: {
    bookingId: string;
    newStartIso: string;
    rescheduledBy: 'PUBLIC' | 'MANAGER' | 'SYSTEM';
    publicUserId?: string | null;
    reason?: BookingRescheduleReason;
    notes?: string;
  }) {
    const {
      bookingId,
      newStartIso,
      rescheduledBy,
      publicUserId,
      reason,
      notes,
    } = params;

    if (!bookingId) throw new BadRequestException('bookingId is required');
    if (!newStartIso) throw new BadRequestException('newStartIso is required');

    // ============================
    // 0) READS + VALIDATIONS (FUERA DE TX)
    // ============================

    const booking = await this.db.query.publicBookings.findFirst({
      where: eq(publicBookings.id, bookingId),
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Cancelled booking cannot be rescheduled');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Completed booking cannot be rescheduled');
    }

    // 🔐 Ownership check (solo PUBLIC)
    if (rescheduledBy === 'PUBLIC') {
      if (!publicUserId) throw new ForbiddenException('Not authenticated');
      if (booking.publicUserId !== publicUserId) {
        throw new ForbiddenException('Booking does not belong to this user');
      }
    }

    const currentAppointments = await this.db.query.appointments.findMany({
      where: eq(appointments.publicBookingId, bookingId),
    });

    if (!currentAppointments.length) {
      throw new BadRequestException('Booking has no appointments');
    }

    // ============================
    // 🔒 RESCHEDULE POLICY CHECK
    // ============================

    const branchSettingsRow = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, booking.branchId),
    });

    const rescheduleWindowMin = branchSettingsRow?.rescheduleWindowMin ?? 480; // fallback 8h

    const now = DateTime.utc();
    const bookingStart = DateTime.fromJSDate(booking.startsAt).toUTC();

    const diffMinutes = bookingStart.diff(now, 'minutes').minutes;

    if (rescheduledBy === 'PUBLIC') {
      if (diffMinutes < rescheduleWindowMin) {
        throw new BadRequestException(
          `This booking cannot be rescheduled less than ${
            rescheduleWindowMin / 60
          } hours before start time`,
        );
      }
    }

    // Snapshot BEFORE
    const beforeSnapshot = {
      booking: {
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        totalCents: booking.totalCents,
      },
      appointments: currentAppointments.map((a) => ({
        id: a.id,
        serviceId: a.serviceId,
        staffId: a.staffId,
        start: a.start,
        end: a.end,
      })),
    };

    // Chain desde booking actual
    const chain = [...currentAppointments]
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map((a) => ({
        serviceId: a.serviceId,
        staffId: a.staffId,
      }));

    const date = DateTime.fromISO(newStartIso).toISODate()!;

    // ============================
    // 1) BUILD PLAN (FUERA DE TX)
    // ============================

    const plan = await this.managerChainBuild({
      branchId: booking.branchId,
      date,
      pinnedStartIso: newStartIso,
      chain,
    });

    // ============================
    // 2) OVERLAP CHECK (FUERA DE TX)
    // ============================

    for (const a of plan.plan.assignments) {
      const overlap = await this.hasOverlap({
        branchId: booking.branchId,
        staffId: a.staffId,
        startUtc: DateTime.fromISO(a.startIso),
        endUtc: DateTime.fromISO(a.endIso),
      });

      if (overlap) {
        throw new BadRequestException('Timeslot already booked');
      }
    }

    // Compute new starts/ends (FUERA DE TX)
    const newStartsAt = DateTime.fromISO(plan.plan.assignments[0].startIso)
      .toUTC()
      .toJSDate();

    const newEndsAt = DateTime.fromISO(
      plan.plan.assignments[plan.plan.assignments.length - 1].endIso,
    )
      .toUTC()
      .toJSDate();

    // Snapshot AFTER
    const afterSnapshot = {
      booking: {
        startsAt: newStartsAt,
        endsAt: newEndsAt,
        totalCents: booking.totalCents,
      },
      appointments: plan.plan.assignments,
    };

    // ============================
    // 3) WRITES (DENTRO DE TX) — SOLO ESCRITURA
    // ============================

    const result = await this.db.transaction(async (tx) => {
      // Re-check rápido (evita reagendar algo que cambió en medio)
      const latest = await tx.query.publicBookings.findFirst({
        where: eq(publicBookings.id, bookingId),
      });

      if (!latest) throw new NotFoundException('Booking not found');

      if (latest.status === 'CANCELLED') {
        throw new BadRequestException(
          'Cancelled booking cannot be rescheduled',
        );
      }

      if (latest.status === 'COMPLETED') {
        throw new BadRequestException(
          'Completed booking cannot be rescheduled',
        );
      }

      // 7️⃣ Update booking
      await tx
        .update(publicBookings)
        .set({
          startsAt: newStartsAt,
          endsAt: newEndsAt,
          updatedAt: new Date(),
        })
        .where(eq(publicBookings.id, bookingId));

      // 8️⃣ Update appointments (shift total)
      // (assume mismo length y mismo orden)
      for (let i = 0; i < currentAppointments.length; i++) {
        const appt = currentAppointments[i];
        const next = plan.plan.assignments[i];

        if (!next) {
          throw new BadRequestException('Plan mismatch with appointments');
        }

        await tx
          .update(appointments)
          .set({
            start: DateTime.fromISO(next.startIso).toUTC().toJSDate(),
            end: DateTime.fromISO(next.endIso).toUTC().toJSDate(),
            updatedAt: new Date(),
          })
          .where(eq(appointments.id, appt.id));
      }

      // 🔟 Historial
      await tx.insert(bookingReschedules).values({
        bookingId,
        rescheduledByPublicUserId: publicUserId ?? null,
        reason: reason ?? 'SYSTEM',
        notes: notes ?? null,
        previousBookingSnapshot: beforeSnapshot,
        newBookingSnapshot: afterSnapshot,
      });

      return { bookingId };
    });

    // ============================
    // 4) SIDE EFFECTS (FUERA DE TX)
    // ============================

    // 🛑 1) Cancelar jobs viejos
    await this.publicBookingJobsService.cancelScheduledJobs(bookingId);

    // ✉️ 2) MAIL DE REAGENDACIÓN  ← AQUÍ VA
    await this.publicBookingJobsService.scheduleRescheduleMail({
      bookingId,
      rescheduledBy,
      reason,
      before: {
        startsAt: beforeSnapshot.booking.startsAt,
        endsAt: beforeSnapshot.booking.endsAt,
      },
      after: {
        startsAt: newStartsAt,
        endsAt: newEndsAt,
      },
    });

    // ⏰ 3) Reprogramar lifecycle nuevo
    await this.publicBookingJobsService.scheduleBookingLifecycle({
      bookingId,
      startsAtUtc: newStartsAt,
      endsAtUtc: newEndsAt,
    });

    // =========================
    // 🔔 NOTIFICATION JOB
    // =========================

    // 1️⃣ Servicios usados
    const serviceIds = [
      ...new Set(currentAppointments.map((a) => a.serviceId)),
    ];

    const servicesUsed = await this.db
      .select({
        id: services.id,
        name: services.name,
        durationMin: services.durationMin,
        priceCents: services.priceCents,
      })
      .from(services)
      .where(inArray(services.id, serviceIds));

    // 2️⃣ Staff asignado
    const staffIds = [...new Set(currentAppointments.map((a) => a.staffId))];

    const staffMembers = await this.db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(inArray(users.id, staffIds));

    // 3️⃣ Cliente

    let client: typeof clients.$inferSelect | null = null;

    const clientId = currentAppointments[0]?.clientId;

    if (clientId) {
      client =
        (await this.db.query.clients.findFirst({
          where: eq(clients.id, clientId),
        })) ?? null;
    }

    // 4️⃣ Call notification job
    await this.notificationsJobService.bookingRescheduled({
      bookingId,
      branchId: booking.branchId,

      schedule: {
        startsAt: newStartsAt,
        endsAt: newEndsAt,
      },

      services: servicesUsed.map((s) => ({
        id: s.id,
        name: s.name,
        durationMin: s.durationMin,
        priceCents: s.priceCents ?? 0,
      })),

      client: client
        ? {
            id: client.id,
            name: client.name,
            avatarUrl: client.avatarUrl,
          }
        : null,

      staff: staffMembers.map((s) => ({
        id: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl,
      })),

      totalCents: booking.totalCents,

      meta: {
        rescheduledBy,
        reason: reason ?? undefined,

        before: {
          startsAt: beforeSnapshot.booking.startsAt,
          endsAt: beforeSnapshot.booking.endsAt,
        },

        after: {
          startsAt: newStartsAt,
          endsAt: newEndsAt,
        },
      },
    });

    await this.calendarRealtime.emitInvalidate({
      branchId: booking.branchId,
      reason: 'booking.rescheduled',
    });

    const timezone = branchSettingsRow?.timezone ?? 'America/Mexico_City';
    const beforeDate = DateTime.fromJSDate(beforeSnapshot.booking.startsAt, {
      zone: 'utc',
    })
      .setZone(timezone)
      .toISODate();
    const afterDate = DateTime.fromJSDate(newStartsAt, { zone: 'utc' })
      .setZone(timezone)
      .toISODate();
    const affectedDates = [beforeDate, afterDate].filter(
      (value): value is string => Boolean(value),
    );
    if (affectedDates.length > 0) {
      await this.availabilityCache.invalidate(
        booking.branchId,
        [...new Set(affectedDates)],
      );
    } else {
      await this.availabilityCache.invalidate(booking.branchId);
    }
    for (const affectedDate of new Set(affectedDates)) {
      await this.availabilityWarm.enqueueDay({
        branchId: booking.branchId,
        date: affectedDate,
      });
    }

    return {
      ok: true,
      bookingId: result.bookingId,
      startsAt: newStartsAt,
      endsAt: newEndsAt,
    };
  }
}
