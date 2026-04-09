export interface AppointmentsPort {
  findByBranchAndRange(params: {
    branchId: string;
    start: Date;
    end: Date;
    staffId?: string;
  }): Promise<
    {
      id: string;
      staffId: string;
      bookingId: string | null;
      start: Date;
      end: Date;
      clientName: string;
      serviceName: string;
      color?: string;
    }[]
  >;

  countDailyByBranchAndRange(params: {
    branchId: string;
    start: Date;
    end: Date;
    timezone: string;
    staffId?: string;
  }): Promise<
    {
      date: string;
      totalAppointments: number;
    }[]
  >;
}
