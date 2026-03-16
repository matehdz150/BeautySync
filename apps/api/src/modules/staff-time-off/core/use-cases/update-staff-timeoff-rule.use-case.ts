import { Inject, Injectable } from '@nestjs/common';
import { STAFF_TIMEOFF_RULES_REPOSITORY } from '../ports/tokens';
import { StaffTimeOffRulesRepository } from '../ports/staff-timeoff-rules.repository.port';

@Injectable()
export class UpdateStaffTimeOffRuleUseCase {
  constructor(
    @Inject(STAFF_TIMEOFF_RULES_REPOSITORY)
    private repo: StaffTimeOffRulesRepository,
  ) {}

  async execute(id: number, data: any) {
    return this.repo.update(id, data);
  }
}
