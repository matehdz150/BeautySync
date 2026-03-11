import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { DateTime } from 'luxon';

import { SlotLockPort } from '../../core/ports/slot-lock.port';
import { REDIS_CACHE } from '../../core/ports/tokens';

@Injectable()
export class RedisSlotLockAdapter implements SlotLockPort {
  constructor(@Inject(REDIS_CACHE) private readonly redis: Redis) {}

  private buildKey(branchId: string, staffId: string, slotIso: string) {
    return `lock:slot:${branchId}:${staffId}:${slotIso}`;
  }

  private buildSlotsInRange(params: {
    startIso: string;
    endIso: string;
    stepMin?: number;
  }): string[] {
    const stepMin = params.stepMin ?? 15;

    const start = DateTime.fromISO(params.startIso, { zone: 'utc' });
    const end = DateTime.fromISO(params.endIso, { zone: 'utc' });

    const slots: string[] = [];
    let cursor = start;

    while (cursor < end) {
      slots.push(cursor.toUTC().toISO()!);
      cursor = cursor.plus({ minutes: stepMin });
    }

    return slots;
  }

  async acquireRange(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    endIso: string;
    ownerToken: string;
    ttlSeconds?: number;
    stepMin?: number;
  }): Promise<boolean> {
    const ttlSeconds = params.ttlSeconds ?? 60;
    const slots = this.buildSlotsInRange(params);

    if (slots.length === 0) return false;

    const keys = slots.map((slotIso) =>
      this.buildKey(params.branchId, params.staffId, slotIso),
    );

    const tx = this.redis.multi();

    for (const key of keys) {
      tx.set(key, params.ownerToken, 'EX', ttlSeconds, 'NX');
    }

    const results = await tx.exec();

    if (!results) return false;

    const allLocked = results.every(([err, res]) => !err && res === 'OK');

    if (allLocked) return true;

    const cleanup = this.redis.multi();

    for (const key of keys) {
      cleanup.get(key);
    }

    const owners = await cleanup.exec();

    if (!owners) return false;

    const deleteTx = this.redis.multi();

    owners.forEach((result, index) => {
      const [, owner] = result;
      if (owner === params.ownerToken) {
        deleteTx.del(keys[index]);
      }
    });

    await deleteTx.exec();

    return false;
  }

  async releaseRange(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    endIso: string;
    ownerToken: string;
    stepMin?: number;
  }): Promise<void> {
    const slots = this.buildSlotsInRange(params);

    if (slots.length === 0) return;

    const keys = slots.map((slotIso) =>
      this.buildKey(params.branchId, params.staffId, slotIso),
    );

    const readTx = this.redis.multi();

    for (const key of keys) {
      readTx.get(key);
    }

    const owners = await readTx.exec();

    if (!owners) return;

    const deleteTx = this.redis.multi();

    owners.forEach((result, index) => {
      const [, owner] = result;
      if (owner === params.ownerToken) {
        deleteTx.del(keys[index]);
      }
    });

    await deleteTx.exec();
  }

  async isRangeLocked(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    endIso: string;
    stepMin?: number;
  }): Promise<boolean> {
    const slots = this.buildSlotsInRange(params);

    if (slots.length === 0) return false;

    const keys = slots.map((slotIso) =>
      this.buildKey(params.branchId, params.staffId, slotIso),
    );

    const tx = this.redis.multi();

    for (const key of keys) {
      tx.exists(key);
    }

    const results = await tx.exec();

    if (!results) return false;

    return results.some(([err, exists]) => !err && exists === 1);
  }

  async getRangeOwners(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    endIso: string;
    stepMin?: number;
  }): Promise<string[]> {
    const slots = this.buildSlotsInRange(params);

    if (slots.length === 0) return [];

    const keys = slots.map((slotIso) =>
      this.buildKey(params.branchId, params.staffId, slotIso),
    );

    const tx = this.redis.multi();

    for (const key of keys) {
      tx.get(key);
    }

    const results = await tx.exec();

    if (!results) return [];

    return results
      .map(([, owner]) => owner)
      .filter((owner): owner is string => typeof owner === 'string');
  }

  async listLockedStarts(params: {
    branchId: string;
    staffIds: string[];
    date: string;
  }): Promise<Map<string, Set<string>>> {
    const result = new Map<string, Set<string>>();

    for (const staffId of params.staffIds) {
      const pattern = `lock:slot:${params.branchId}:${staffId}:${params.date}*`;
      const keys = await this.redis.keys(pattern);

      const starts = new Set<string>();

      for (const key of keys) {
        const parts = key.split(':');
        const startIso = parts.slice(4).join(':');
        starts.add(startIso);
      }

      result.set(staffId, starts);
    }

    return result;
  }
}
