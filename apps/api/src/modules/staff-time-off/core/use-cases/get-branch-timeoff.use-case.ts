import { Inject, Injectable } from '@nestjs/common';
import { StaffTimeOffRepository } from '../ports/staff-timeoff.repository.port';
import { STAFF_TIMEOFF_REPOSITORY } from '../ports/tokens';

@Injectable()
export class GetBranchTimeOffUseCase {
  constructor(
    @Inject(STAFF_TIMEOFF_REPOSITORY)
    private repo: StaffTimeOffRepository,
  ) {}

  async execute(branchId: string) {
    return this.repo.findForBranch(branchId);
  }
}
