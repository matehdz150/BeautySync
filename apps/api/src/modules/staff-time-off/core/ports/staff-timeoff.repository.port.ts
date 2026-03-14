// core/ports/staff-timeoff.repository.port.ts

import { StaffTimeOff } from '../entities/staff-time-off-entity';

export interface StaffTimeOffRepository {
  findForStaff(staffId: string): Promise<StaffTimeOff[]>;

  create(data: {
    staffId: string;
    start: Date;
    end: Date;
    reason?: string;
  }): Promise<StaffTimeOff>;

  createMany(
    data: {
      staffId: string;
      start: Date;
      end: Date;
      reason?: string;
    }[],
  ): Promise<void>;

  update(
    id: number,
    data: Partial<{
      start: Date;
      end: Date;
      reason?: string;
    }>,
  ): Promise<StaffTimeOff>;

  delete(id: number): Promise<void>;
}
