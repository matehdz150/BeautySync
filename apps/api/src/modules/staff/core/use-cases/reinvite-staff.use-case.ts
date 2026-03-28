import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { STAFF_REPOSITORY } from '../ports/tokens';
import * as staffRepository from '../ports/staff.repository';

@Injectable()
export class ReinviteStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: staffRepository.StaffRepository,
  ) {}

  async execute(staffId: string) {
    const staff = await this.repo.findById(staffId);

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    if (!staff.email) {
      throw new BadRequestException('Staff has no email');
    }

    const invite = await this.repo.findLatestInviteByStaffId(staffId);

    if (invite) {
      if (invite.status === 'accepted') {
        throw new BadRequestException('Staff already accepted invite');
      }

      const isStillValid =
        invite.status === 'pending' && invite.expiresAt > new Date();

      if (isStillValid) {
        throw new BadRequestException(
          'An active invite already exists. Please wait until it expires.',
        );
      }
    }

    return this.repo.reinviteStaff(staffId);
  }
}
