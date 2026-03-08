import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import * as invitesRepository from '../../ports/invites.repository';
import * as staffRepository from '../../ports/staff.repository';
import { INVITES_REPOSITORY, STAFF_REPOSITORY } from '../../ports/tokens';

export class ValidateInviteUseCase {
  constructor(
    @Inject(INVITES_REPOSITORY)
    private invitesRepo: invitesRepository.InvitesRepositoryPort,
    @Inject(STAFF_REPOSITORY)
    private staffRepo: staffRepository.StaffRepositoryPort,
  ) {}

  async execute(token: string) {
    const invite = await this.invitesRepo.findByToken(token);

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite expired');
    }

    if (invite.accepted) {
      throw new BadRequestException('Invite already accepted');
    }

    const staff = await this.staffRepo.findById(invite.staffId);

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return {
      email: invite.email,
      staffName: staff.id,
      role: invite.role,
    };
  }
}
