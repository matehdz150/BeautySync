import { Inject, Injectable } from '@nestjs/common';
import {
  STAFF_TIMEOFF_REPOSITORY,
  STAFF_TIMEOFF_RULES_REPOSITORY,
} from '../ports/tokens';
import { StaffTimeOffRepository } from '../ports/staff-timeoff.repository.port';
import { StaffTimeOffRulesRepository } from '../ports/staff-timeoff-rules.repository.port';

@Injectable()
export class GetStaffTimeOffDetailUseCase {
  constructor(
    @Inject(STAFF_TIMEOFF_REPOSITORY)
    private readonly timeOffRepo: StaffTimeOffRepository,

    @Inject(STAFF_TIMEOFF_RULES_REPOSITORY)
    private readonly rulesRepo: StaffTimeOffRulesRepository,
  ) {}

  async execute(input: {
    timeOffId: number;
    staffId: string;
    branchId: string;
  }) {
    const { timeOffId, staffId, branchId } = input;

    if (!timeOffId || !staffId || !branchId) {
      throw new Error('Invalid input');
    }

    // 🔥 1. buscar timeoff (seguro)
    const timeOff = await this.timeOffRepo.findOne({
      id: timeOffId,
      staffId,
      branchId,
    });

    if (!timeOff) {
      throw new Error('TIMEOFF_NOT_FOUND');
    }

    // 🔥 2. traer reglas del staff
    const rules = await this.rulesRepo.findForStaff(staffId);

    return {
      timeOff,
      rules,
    };
  }
}
