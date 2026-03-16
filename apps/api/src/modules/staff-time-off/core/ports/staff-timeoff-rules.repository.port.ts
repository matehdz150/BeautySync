import { StaffTimeOffRule } from '../entities/staff-time-off-rule.entity';

export interface StaffTimeOffRulesRepository {
  findForStaff(staffId: string): Promise<StaffTimeOffRule[]>;

  findForBranch(branchId: string): Promise<StaffTimeOffRule[]>;

  create(data: {
    staffId: string;
    recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY';
    daysOfWeek?: number[];
    startTime: string;
    endTime: string;
    startDate: Date;
    endDate?: Date;
    reason?: string;
  }): Promise<StaffTimeOffRule>;

  update(
    id: number,
    data: Partial<{
      recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY';
      daysOfWeek?: number[];
      startTime?: string;
      endTime?: string;
      startDate?: Date;
      endDate?: Date;
      reason?: string;
    }>,
  ): Promise<StaffTimeOffRule>;

  delete(id: number): Promise<void>;
}
