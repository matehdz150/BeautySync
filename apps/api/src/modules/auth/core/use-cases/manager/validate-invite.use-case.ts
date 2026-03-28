import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import * as invitesRepository from '../../ports/invites.repository';
import * as staffRepository from '../../ports/staff.repository';
import { INVITES_REPOSITORY, STAFF_REPOSITORY } from '../../ports/tokens';
import { PUBLIC_BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { PublicBranchesRepository } from 'src/modules/branches/core/ports/public-branches.repository';

export class ValidateInviteUseCase {
  constructor(
    @Inject(INVITES_REPOSITORY)
    private invitesRepo: invitesRepository.InvitesRepositoryPort,
    @Inject(STAFF_REPOSITORY)
    private staffRepo: staffRepository.StaffRepositoryPort,
    @Inject(PUBLIC_BRANCHES_REPOSITORY)
    private publicBranchesRepo: PublicBranchesRepository,
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

    const branch = await this.publicBranchesRepo.getSummaryById(staff.branchId);

    return {
      email: invite.email,
      role: invite.role,

      staff: {
        name: staff.name,
        avatarUrl: staff.avatarUrl ?? null,
      },

      branch: {
        name: branch.name,
        coverUrl: branch.coverUrl ?? null,

        rating: {
          average: branch.rating.average,
          count: branch.rating.count,
        },
      },
    };
  }
}
