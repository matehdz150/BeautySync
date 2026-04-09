import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import Redis from 'ioredis';
import { DateTime } from 'luxon';

import { REDIS_CACHE } from 'src/modules/cache/core/ports/tokens';

import { AvailabilityDaySnapshot } from '../../core/entities/availability-day-snapshot.entity';
import { AvailabilityServicesSnapshot } from '../../core/entities/availability-services-snapshot.entity';
import { AvailabilityServicesRepository } from '../../core/ports/availability-services.repository';
import { AvailabilitySnapshotRepository } from '../../core/ports/availability-snapshot.repository';
import { AVAILABILITY_SNAPSHOT_REPOSITORY } from '../../core/ports/tokens';

@Injectable()
export class RedisAvailabilityServicesRepository
  implements AvailabilityServicesRepository
{
  private static readonly TTL_SECONDS = 600;
  private static readonly STALE_AFTER_SECONDS = 30;
  private static readonly EXPIRE_AFTER_SECONDS = 300;
  private readonly inflight = new Map<string, Promise<AvailabilityServicesSnapshot>>();

  constructor(
    @Inject(REDIS_CACHE)
    private readonly redis: Redis,
    @Inject(AVAILABILITY_SNAPSHOT_REPOSITORY)
    private readonly snapshots: AvailabilitySnapshotRepository,
  ) {}

  async get(
    branchId: string,
    date: string,
  ): Promise<AvailabilityServicesSnapshot | null> {
    const raw = await this.redis.get(this.buildKey(branchId, date));
    if (!raw) {
      return null;
    }

    const snapshot = JSON.parse(raw) as AvailabilityServicesSnapshot;
    return this.normalizeSnapshot(snapshot);
  }

  async set(snapshot: AvailabilityServicesSnapshot): Promise<void> {
    await this.redis.set(
      this.buildKey(snapshot.branchId, snapshot.date),
      JSON.stringify(snapshot),
      'EX',
      RedisAvailabilityServicesRepository.TTL_SECONDS,
    );
  }

  async buildFromSnapshot(
    branchId: string,
    date: string,
  ): Promise<AvailabilityServicesSnapshot> {
    const key = this.buildKey(branchId, date);
    const inflight = this.inflight.get(key);
    if (inflight) {
      return inflight;
    }

    const promise = (async () => {
      const daySnapshot = await this.snapshots.get(branchId, date);
      if (!daySnapshot) {
        throw new ServiceUnavailableException('AVAILABILITY_SNAPSHOT_NOT_READY');
      }

      console.log('[AvailabilityServices] BUILD FROM SNAPSHOT ONLY', branchId, date);
      const servicesSnapshot = this.transformDaySnapshot(daySnapshot);
      await this.set(servicesSnapshot);
      return servicesSnapshot;
    })();

    this.inflight.set(key, promise);

    try {
      return await promise;
    } finally {
      if (this.inflight.get(key) === promise) {
        this.inflight.delete(key);
      }
    }
  }

  async invalidate(branchId: string, date?: string): Promise<void> {
    if (date) {
      await this.redis.del(this.buildKey(branchId, date));
      return;
    }

    const stream = this.redis.scanStream({
      match: `availability:services:${branchId}:*`,
      count: 100,
    });

    for await (const keys of stream) {
      const batch = keys as string[];
      if (batch.length) {
        await this.redis.del(...batch);
      }
    }
  }

  buildKey(branchId: string, date: string) {
    return `availability:services:${branchId}:${date}`;
  }

  private transformDaySnapshot(
    snapshot: AvailabilityDaySnapshot,
  ): AvailabilityServicesSnapshot {
    if (!snapshot?.branchId || !snapshot?.date || !snapshot?.timezone) {
      throw new Error('Invalid snapshot: missing required root fields');
    }

    if (!Array.isArray(snapshot.services)) {
      throw new Error('Invalid snapshot: missing required services');
    }

    const generatedAt = new Date();

    return {
      branchId: snapshot.branchId,
      date: snapshot.date,
      generatedAt: generatedAt.toISOString(),
      staleAt: new Date(
        generatedAt.getTime() +
          RedisAvailabilityServicesRepository.STALE_AFTER_SECONDS * 1000,
      ).toISOString(),
      expiresAt: new Date(
        generatedAt.getTime() +
          RedisAvailabilityServicesRepository.EXPIRE_AFTER_SECONDS * 1000,
      ).toISOString(),
      staff: snapshot.staff.map((member) => ({
        id: member.id,
        name: member.name,
        avatarUrl: member.avatarUrl,
      })),
      services: snapshot.services.map((service) => {
        if (!service?.id || !service?.name) {
          throw new Error('Invalid snapshot: missing required service fields');
        }

        if (!Array.isArray(service.availableStaffIdsByStart)) {
          throw new Error('Invalid snapshot: missing required availability data');
        }

        const availableStaffIds = new Set<string>();
        const availableSlots = service.availableStaffIdsByStart.map(
          ([startMs, staffIds]) => {
            if (!Number.isFinite(startMs)) {
              throw new Error('Invalid snapshot: missing required slot start');
            }

            if (!Array.isArray(staffIds) || staffIds.some((staffId) => !staffId)) {
              throw new Error('Invalid snapshot: missing required staffId');
            }

            for (const staffId of staffIds) {
              availableStaffIds.add(staffId);
            }

            const startAt = DateTime.fromMillis(startMs, {
              zone: 'utc',
            }).setZone(snapshot.timezone);
            const endAt = startAt.plus({ minutes: service.durationMin });

            return {
              start: startAt.toUTC().toISO() as string,
              end: endAt.toUTC().toISO() as string,
              staffIds,
            };
          },
        );

        return {
          serviceId: service.id,
          serviceName: service.name,
          durationMin: service.durationMin,
          priceCents: service.priceCents,
          category: {
            id: service.categoryId,
            name: service.categoryName,
            colorHex: service.categoryColor,
          },
          availableStaffIds: [...availableStaffIds],
          availableSlots,
        };
      }),
    };
  }

  private normalizeSnapshot(
    snapshot: AvailabilityServicesSnapshot,
  ): AvailabilityServicesSnapshot {
    const generatedAtMs = new Date(snapshot.generatedAt).getTime();
    const generatedAt = Number.isFinite(generatedAtMs)
      ? generatedAtMs
      : Date.now();

    return {
      ...snapshot,
      staleAt:
        snapshot.staleAt ??
        new Date(
          generatedAt +
            RedisAvailabilityServicesRepository.STALE_AFTER_SECONDS * 1000,
        ).toISOString(),
      expiresAt:
        snapshot.expiresAt ??
        new Date(
          generatedAt +
            RedisAvailabilityServicesRepository.EXPIRE_AFTER_SECONDS * 1000,
        ).toISOString(),
    };
  }
}
