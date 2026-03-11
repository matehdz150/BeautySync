import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { SlotLockPort } from '../../core/ports/slot-lock.port';

@Injectable()
export class RedisSlotLockAdapter implements SlotLockPort {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  private buildKey(branchId: string, staffId: string, startIso: string) {
    return `lock:slot:${branchId}:${staffId}:${startIso}`;
  }

  async acquire(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    ttlSeconds?: number;
    ownerToken: string;
  }): Promise<boolean> {
    const key = this.buildKey(params.branchId, params.staffId, params.startIso);

    const res = await this.redis.set(
      key,
      params.ownerToken,
      'EX',
      params.ttlSeconds ?? 30,
      'NX',
    );

    return res === 'OK';
  }

  async release(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    ownerToken: string;
  }): Promise<void> {
    const key = this.buildKey(params.branchId, params.staffId, params.startIso);

    const currentOwner = await this.redis.get(key);

    if (currentOwner === params.ownerToken) {
      await this.redis.del(key);
    }
  }

  async isLocked(params: {
    branchId: string;
    staffId: string;
    startIso: string;
  }): Promise<boolean> {
    const key = this.buildKey(params.branchId, params.staffId, params.startIso);
    return (await this.redis.exists(key)) === 1;
  }

  async getOwner(params: {
    branchId: string;
    staffId: string;
    startIso: string;
  }): Promise<string | null> {
    const key = this.buildKey(params.branchId, params.staffId, params.startIso);
    return this.redis.get(key);
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
