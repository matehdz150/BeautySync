// src/modules/branch/branch-settings.service.ts

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { branchSettings } from 'drizzle/schema';
import { eq } from 'drizzle-orm';
import * as client from 'src/modules/db/client';

type UpdateBranchSettingsInput = {
  timezone?: string;
  minBookingNoticeMin?: number;
  maxBookingAheadDays?: number;
  cancelationWindowMin?: number;
  rescheduleWindowMin?: number;
  bufferBeforeMin?: number;
  bufferAfterMin?: number;
};

@Injectable()
export class BranchSettingsService {
  constructor(@Inject('DB') private readonly db: client.DB) {}

  async update(branchId: string, input: UpdateBranchSettingsInput) {
    const existing = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branchId),
    });

    const updateData = {
      timezone: input.timezone,
      minBookingNoticeMin: input.minBookingNoticeMin,
      maxBookingAheadDays: input.maxBookingAheadDays,
      cancelationWindowMin: input.cancelationWindowMin,
      rescheduleWindowMin: input.rescheduleWindowMin,
      bufferBeforeMin: input.bufferBeforeMin,
      bufferAfterMin: input.bufferAfterMin,
    };

    if (!existing) {
      const [created] = await this.db
        .insert(branchSettings)
        .values({
          branchId,
          ...updateData,
        })
        .returning();

      return created;
    }

    const [updated] = await this.db
      .update(branchSettings)
      .set(updateData)
      .where(eq(branchSettings.branchId, branchId))
      .returning();

    return updated;
  }

  async getByBranch(branchId: string) {
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branchId),
    });

    if (!settings) {
      throw new NotFoundException('Settings not found');
    }

    return settings;
  }
}
