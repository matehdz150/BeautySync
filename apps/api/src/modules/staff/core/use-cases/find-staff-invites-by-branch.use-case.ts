import { Inject, Injectable } from '@nestjs/common';
import { STAFF_REPOSITORY } from '../ports/tokens';
import { StaffRepository } from '../ports/staff.repository';

@Injectable()
export class GetStaffWithInvitesUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: StaffRepository,
  ) {}

  async execute(branchId: string) {
    return this.repo.findByBranchWithInvites(branchId);
  }
}
