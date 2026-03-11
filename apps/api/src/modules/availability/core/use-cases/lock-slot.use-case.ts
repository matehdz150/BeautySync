import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { SLOT_LOCK_PORT } from 'src/modules/cache/core/ports/tokens';
import { SlotLockPort } from 'src/modules/cache/core/ports/slot-lock.port';

@Injectable()
export class LockSlotUseCase {
  constructor(
    @Inject(SLOT_LOCK_PORT)
    private readonly slotLock: SlotLockPort,
  ) {}

  async execute(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    endIso: string;
    ttlSeconds?: number;
    ownerToken: string;
    stepMin?: number;
  }) {
    const ok = await this.slotLock.acquireRange(params);

    if (!ok) {
      throw new ConflictException('Slot already locked');
    }

    return { ok: true };
  }
}
