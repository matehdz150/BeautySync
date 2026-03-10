import { Inject, Injectable } from '@nestjs/common';
import { STAFF_REPOSITORY } from '../ports/tokens';
import * as staffRepository from '../ports/staff.repository';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

@Injectable()
export class UpdateStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: staffRepository.StaffRepository,
  ) {}

  execute(
    id: string,
    data: staffRepository.UpdateStaffInput,
    user: AuthenticatedUser,
  ) {
    return this.repo.update(id, data, user);
  }
}
