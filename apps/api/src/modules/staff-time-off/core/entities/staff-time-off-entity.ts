// core/entities/staff-timeoff.entity.ts

export class StaffTimeOff {
  constructor(
    public id: number,
    public staffId: string,
    public start: Date,
    public end: Date,
    public reason?: string,
  ) {}
}
