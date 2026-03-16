export interface StaffTimeOffRule {
  id: number;
  staffId: string;

  recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY';

  daysOfWeek?: number[];

  startTime: string;
  endTime: string;

  startDate: Date;
  endDate?: Date;

  reason?: string;

  createdAt: Date;
}
