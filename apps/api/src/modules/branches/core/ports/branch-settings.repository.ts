import { BranchSettings } from '../entities/branch-settings.entity';

export interface UpdateBranchSettingsInput {
  timezone?: string;
  minBookingNoticeMin?: number;
  maxBookingAheadDays?: number;
  cancelationWindowMin?: number;
  rescheduleWindowMin?: number;
  bufferBeforeMin?: number;
  bufferAfterMin?: number;
}

export interface BranchSettingsRepository {
  getByBranch(branchId: string): Promise<BranchSettings>;

  update(
    branchId: string,
    input: UpdateBranchSettingsInput,
  ): Promise<BranchSettings>;
}
