// infrastructure/adapters/drizzle-user-tier-state.repository.ts

import { Inject, Injectable } from '@nestjs/common';
import { DB } from 'src/modules/db/client';
import { eq } from 'drizzle-orm';

import { userTierState } from 'src/modules/db/schema';

import {
  UserTierStateRepository,
  UserTierState,
} from '../../core/ports/user-tier-state.repository';

@Injectable()
export class DrizzleUserTierStateRepository implements UserTierStateRepository {
  constructor(@Inject('DB') private readonly db: DB) {}

  async getByUser(userId: string): Promise<UserTierState[]> {
    const rows = await this.db
      .select()
      .from(userTierState)
      .where(eq(userTierState.userId, userId));

    return rows.map((r) => ({
      userId: r.userId,
      branchId: r.branchId,
      currentTierId: r.currentTierId,
    }));
  }
}
