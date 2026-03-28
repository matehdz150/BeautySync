import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { STAFF_REPOSITORY } from '../ports/tokens';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import * as staffRepository from '../ports/staff.repository';

@Injectable()
export class InviteStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: staffRepository.StaffRepository,
  ) {}

  async execute(params: {
    email: string;
    staffId: string;
    role: 'staff' | 'manager';
    user: AuthenticatedUser;
  }) {
    const staff = await this.repo.findById(params.staffId);

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    if (!staff.email) {
      throw new BadRequestException('Staff has no email');
    }

    if (staff.email !== params.email) {
      throw new BadRequestException('Email does not match staff record');
    }

    // 🔥 INVITES LOGIC
    const invite = await this.repo.findLatestInviteByStaffId(params.staffId);

    if (invite) {
      // ❌ ya aceptó
      if (invite.status === 'accepted') {
        throw new BadRequestException('Staff already accepted invite');
      }

      // ❌ invite activa
      const isStillValid =
        invite.status === 'pending' && invite.expiresAt > new Date();

      if (isStillValid) {
        throw new BadRequestException('An active invite already exists');
      }
    }

    return this.repo.inviteStaff(
      params.email,
      params.staffId,
      params.role,
      params.user,
    );
  }
}
