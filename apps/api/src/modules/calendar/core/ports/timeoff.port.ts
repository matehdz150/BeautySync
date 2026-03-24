export interface TimeOffPort {
  findByBranchAndRange(params: {
    branchId: string;
    start: Date;
    end: Date;
    staffId?: string;
  }): Promise<
    {
      id: number;
      staffId: string;
      start: Date;
      end: Date;
      reason?: string;
    }[]
  >;
}
