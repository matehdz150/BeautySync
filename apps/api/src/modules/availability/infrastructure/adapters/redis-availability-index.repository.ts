import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { DateTime } from 'luxon';

import { REDIS_CACHE } from 'src/modules/cache/core/ports/tokens';

import { AvailabilityIndexSlot } from '../../core/entities/availability-global-index.entity';
import { AvailabilityIndexRepository } from '../../core/ports/availability-index.repository';
import { AvailabilitySnapshotRepository } from '../../core/ports/availability-snapshot.repository';
import { AVAILABILITY_SNAPSHOT_REPOSITORY } from '../../core/ports/tokens';

@Injectable()
export class RedisAvailabilityIndexRepository
  implements AvailabilityIndexRepository
{
  private static readonly TTL_SECONDS = 300;

  constructor(
    @Inject(REDIS_CACHE)
    private readonly redis: Redis,
    @Inject(AVAILABILITY_SNAPSHOT_REPOSITORY)
    private readonly snapshots: AvailabilitySnapshotRepository,
  ) {}

  async buildIndex(branchId: string, start: Date, end: Date): Promise<void> {
    const key = this.buildKey(branchId);
    const pipeline = this.redis.pipeline();

    // Simpler/safer for now: rebuild full future index in one pass.
    // TODO: replace with day-level upserts + ZREMRANGEBYSCORE for fine-grained updates.
    pipeline.del(key);

    let cursor = DateTime.fromJSDate(start).startOf('day');
    const lastDay = DateTime.fromJSDate(end).startOf('day');

    while (cursor <= lastDay) {
      const date = cursor.toISODate();
      if (!date) {
        cursor = cursor.plus({ days: 1 });
        continue;
      }

      const snapshot = await this.snapshots.get(branchId, date);
      if (!snapshot) {
        cursor = cursor.plus({ days: 1 });
        continue;
      }

      for (const slot of this.buildSlotsFromSnapshot(snapshot)) {
        const startAt = DateTime.fromISO(`${slot.date}T${slot.start}`, {
          zone: snapshot.timezone,
        }).toUTC();

        pipeline.zadd(
          key,
          startAt.toMillis(),
          JSON.stringify(slot),
        );
      }

      cursor = cursor.plus({ days: 1 });
    }

    pipeline.expire(key, RedisAvailabilityIndexRepository.TTL_SECONDS);
    await pipeline.exec();
  }

  async getRange(
    branchId: string,
    start: Date,
    end: Date,
  ): Promise<AvailabilityIndexSlot[]> {
    const members = await this.redis.zrangebyscore(
      this.buildKey(branchId),
      start.getTime(),
      end.getTime(),
    );

    return members.map((member) => JSON.parse(member) as AvailabilityIndexSlot);
  }

  async getNextAvailable(
    branchId: string,
    fromTimestamp: number,
  ): Promise<AvailabilityIndexSlot | null> {
    const members = await this.redis.zrangebyscore(
      this.buildKey(branchId),
      fromTimestamp,
      '+inf',
      'LIMIT',
      0,
      1,
    );

    if (!members.length) {
      return null;
    }

    return JSON.parse(members[0]) as AvailabilityIndexSlot;
  }

  async invalidate(branchId: string): Promise<void> {
    await this.redis.del(this.buildKey(branchId));
  }

  buildKey(branchId: string) {
    return `availability:index:${branchId}`;
  }

  private buildSlotsFromSnapshot(snapshot: {
    date: string;
    timezone: string;
    stepMin: number;
    services: Array<{
      id: string;
      availableStaffIdsByStart: Array<[number, string[]]>;
    }>;
  }): AvailabilityIndexSlot[] {
    const slotMap = new Map<
      number,
      {
        serviceIds: Set<string>;
        staffIds: Set<string>;
      }
    >();

    for (const service of snapshot.services) {
      for (const [startMs, staffIds] of service.availableStaffIdsByStart) {
        const current = slotMap.get(startMs) ?? {
          serviceIds: new Set<string>(),
          staffIds: new Set<string>(),
        };

        current.serviceIds.add(service.id);
        for (const staffId of staffIds) {
          current.staffIds.add(staffId);
        }

        slotMap.set(startMs, current);
      }
    }

    return [...slotMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([startMs, value]) => {
        const startAt = DateTime.fromMillis(startMs, { zone: 'utc' }).setZone(
          snapshot.timezone,
        );

        return {
          date: snapshot.date,
          start: startAt.toFormat('HH:mm'),
          end: startAt.plus({ minutes: snapshot.stepMin }).toFormat('HH:mm'),
          serviceIds: [...value.serviceIds].sort(),
          staffIds: [...value.staffIds].sort(),
        };
      });
  }
}
