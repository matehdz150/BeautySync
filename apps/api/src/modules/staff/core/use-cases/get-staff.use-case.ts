import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { STAFF_REPOSITORY } from '../ports/tokens';
import * as staffRepository from '../ports/staff.repository';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

@Injectable()
export class GetStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: staffRepository.StaffRepository,
  ) {}

  async execute(id: string, user: AuthenticatedUser) {
    const staff = await this.repo.findById(id, user);

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff;
  }
}
