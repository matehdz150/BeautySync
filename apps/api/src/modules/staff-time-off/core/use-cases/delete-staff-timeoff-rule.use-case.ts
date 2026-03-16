import { Inject, Injectable } from '@nestjs/common';
import { STAFF_TIMEOFF_RULES_REPOSITORY } from '../ports/tokens';
import { StaffTimeOffRulesRepository } from '../ports/staff-timeoff-rules.repository.port';

@Injectable()
export class DeleteStaffTimeOffRuleUseCase {
  constructor(
    @Inject(STAFF_TIMEOFF_RULES_REPOSITORY)
    private repo: StaffTimeOffRulesRepository,
  ) {}

  async execute(id: number) {
    await this.repo.delete(id);
  }
}
