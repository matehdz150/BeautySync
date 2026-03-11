import { Inject, Injectable } from '@nestjs/common';
import { SlotLockPort } from 'src/modules/cache/core/ports/slot-lock.port';
import { SLOT_LOCK_PORT } from 'src/modules/cache/core/ports/tokens';

@Injectable()
export class UnlockSlotUseCase {
  constructor(
    @Inject(SLOT_LOCK_PORT)
    private readonly slotLock: SlotLockPort,
  ) {}

  async execute(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    endIso: string;
    ownerToken: string;
    stepMin?: number;
  }) {
    await this.slotLock.releaseRange(params);
    return { ok: true };
  }
}
