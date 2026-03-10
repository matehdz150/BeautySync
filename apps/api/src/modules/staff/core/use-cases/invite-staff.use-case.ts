import { Inject, Injectable } from '@nestjs/common';
import { STAFF_REPOSITORY } from '../ports/tokens';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import * as staffRepository from '../ports/staff.repository';

@Injectable()
export class InviteStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: staffRepository.StaffRepository,
  ) {}

  execute(params: {
    email: string;
    staffId: string;
    role: 'staff' | 'manager';
    user: AuthenticatedUser;
  }) {
    return this.repo.inviteStaff(
      params.email,
      params.staffId,
      params.role,
      params.user,
    );
  }
}
