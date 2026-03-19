import { Inject, Injectable } from '@nestjs/common';
import { STAFF_TIMEOFF_RULES_REPOSITORY } from '../ports/tokens';
import { StaffTimeOffRulesRepository } from '../ports/staff-timeoff-rules.repository.port';

@Injectable()
export class CreateStaffTimeOffRuleUseCase {
  constructor(
    @Inject(STAFF_TIMEOFF_RULES_REPOSITORY)
    private repo: StaffTimeOffRulesRepository,
  ) {}

  async execute(params: {
    staffId: string;
    recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY';
    daysOfWeek?: number[];
    startTime: string;
    endTime: string;
    startDate: Date;
    endDate?: Date;
    reason?: string;
  }) {
    return this.repo.create(params);
  }
}
