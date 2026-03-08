import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';

import * as usersRepository from '../../ports/users.repository';
import * as invitesRepository from '../../ports/invites.repository';
import * as staffRepository from '../../ports/staff.repository';
import * as branchesRepository from '../../ports/branches.repository';
import * as passwordHasherPort from '../../ports/password-hasher.port';
import {
  BRANCHES_REPOSITORY,
  INVITES_REPOSITORY,
  PASSWORD_HASHER,
  PUBLIC_USERS_REPOSITORY,
  STAFF_REPOSITORY,
} from '../../ports/tokens';

export class AcceptInviteUseCase {
  constructor(
    @Inject(PUBLIC_USERS_REPOSITORY)
    private usersRepo: usersRepository.UsersRepositoryPort,
    @Inject(INVITES_REPOSITORY)
    private invitesRepo: invitesRepository.InvitesRepositoryPort,
    @Inject(STAFF_REPOSITORY)
    private staffRepo: staffRepository.StaffRepositoryPort,
    @Inject(BRANCHES_REPOSITORY)
    private branchesRepo: branchesRepository.BranchesRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private hasher: passwordHasherPort.PasswordHasherPort,
  ) {}

  async execute(input: { token: string; password: string }) {
    if (!input.token) {
      throw new BadRequestException('Invite token is required');
    }

    const invite = await this.invitesRepo.findByToken(input.token);

    if (!invite) throw new NotFoundException('Invite not found');

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite expired');
    }

    if (invite.accepted) {
      throw new BadRequestException('Invite already used');
    }

    const staff = await this.staffRepo.findById(invite.staffId);

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    if (staff.email !== invite.email) {
      throw new BadRequestException('Invite email mismatch');
    }

    const branch = await this.branchesRepo.findById(staff.branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const existing = await this.usersRepo.findByEmail(invite.email);

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await this.hasher.hash(input.password);

    const user = await this.usersRepo.create({
      email: invite.email,
      passwordHash,
      role: invite.role,
      organizationId: branch.organizationId,
    });

    await this.staffRepo.linkUser(staff.id, user.id);

    await this.invitesRepo.markAccepted(invite.id);

    return { ok: true };
  }
}
