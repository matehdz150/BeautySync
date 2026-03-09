export interface BranchSettings {
  id: string;
  branchId: string;

  timezone: string;

  minBookingNoticeMin: number | null;
  maxBookingAheadDays: number | null;

  cancelationWindowMin: number | null;
  rescheduleWindowMin: number | null;

  bufferBeforeMin: number | null;
  bufferAfterMin: number | null;

  createdAt: Date | null;
}
