import { BranchSettings } from '../../core/entities/branch-settings.entity';
import { branchSettings } from 'src/modules/db/schema';

type BranchSettingsRow = typeof branchSettings.$inferSelect;

export class BranchSettingsMapper {
  static toDomain(row: BranchSettingsRow): BranchSettings {
    return {
      id: row.id,
      branchId: row.branchId,
      timezone: row.timezone,

      minBookingNoticeMin: row.minBookingNoticeMin,
      maxBookingAheadDays: row.maxBookingAheadDays,

      cancelationWindowMin: row.cancelationWindowMin,
      rescheduleWindowMin: row.rescheduleWindowMin,

      bufferBeforeMin: row.bufferBeforeMin,
      bufferAfterMin: row.bufferAfterMin,

      createdAt: row.createdAt,
    };
  }
}
