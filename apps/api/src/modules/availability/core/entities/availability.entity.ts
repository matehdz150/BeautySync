export class StaffAvailability {
  constructor(
    public staffId: string,
    public slots: string[],
  ) {}
}

export class AvailabilityResult {
  constructor(
    public branchId: string,
    public date: string,
    public staff: StaffAvailability[],
  ) {}
}
