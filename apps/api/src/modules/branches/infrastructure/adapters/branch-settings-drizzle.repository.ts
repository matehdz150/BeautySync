import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { branchSettings } from 'src/modules/db/schema';
import { eq } from 'drizzle-orm';
import * as client from 'src/modules/db/client';
import {
  BranchSettingsRepository,
  UpdateBranchSettingsInput,
} from '../../core/ports/branch-settings.repository';
import { BranchSettingsMapper } from '../mappers/branch-settings.mapper';
import { BranchSettings } from '../../core/entities/branch-settings.entity';

@Injectable()
export class BranchSettingsDrizzleRepository implements BranchSettingsRepository {
  constructor(@Inject('DB') private readonly db: client.DB) {}

  async update(
    branchId: string,
    input: UpdateBranchSettingsInput,
  ): Promise<BranchSettings> {
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

      return BranchSettingsMapper.toDomain(created);
    }

    const [updated] = await this.db
      .update(branchSettings)
      .set(updateData)
      .where(eq(branchSettings.branchId, branchId))
      .returning();

    return BranchSettingsMapper.toDomain(updated);
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
