// core/entities/staff-timeoff.entity.ts

export class StaffTimeOff {
  constructor(
    public id: number,
    public staffId: string,
    public branchId: string,
    public start: Date,
    public end: Date,
    public reason?: string,
  ) {}
}

export type CreateStaffTimeOffInput = {
  staffId: string;

  // instancia simple
  start?: Date;
  end?: Date;

  // rule (opcional)
  rule?: {
    recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY';
    daysOfWeek?: number[];
    startTime: string;
    endTime: string;
    startDate: Date;
    endDate?: Date;
  };

  reason?: string;
};
