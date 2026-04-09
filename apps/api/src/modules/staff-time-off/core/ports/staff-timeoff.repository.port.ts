// core/ports/staff-timeoff.repository.port.ts

import { StaffTimeOff } from '../entities/staff-time-off-entity';

export interface StaffTimeOffRepository {
  findForStaff(staffId: string): Promise<StaffTimeOff[]>;

  findForBranch(branchId: string): Promise<StaffTimeOff[]>;

  create(data: {
    staffId: string;
    start: Date;
    end: Date;
    branchId: string;
    reason?: string;
  }): Promise<StaffTimeOff>;

  createMany(
    data: {
      staffId: string;
      branchId: string;
      start: Date;
      end: Date;
      reason?: string;
    }[],
  ): Promise<StaffTimeOff[]>;

  update(
    id: number,
    data: Partial<{
      start: Date;
      end: Date;
      reason?: string;
    }>,
  ): Promise<StaffTimeOff>;

  delete(id: number): Promise<void>;

  findOne(params: {
    id: number;
    staffId: string;
    branchId: string;
  }): Promise<StaffTimeOff | null>;

  findById(id: number): Promise<StaffTimeOff | null>;
}
