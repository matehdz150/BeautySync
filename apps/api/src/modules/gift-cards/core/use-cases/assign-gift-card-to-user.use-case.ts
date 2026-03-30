import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { GIFT_CARD_REPOSITORY } from '../ports/tokens';
import { GiftCardRepository } from '../ports/gift-card.repository';

import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

import { PUBLIC_USERS_REPOSITORY } from 'src/modules/auth/core/ports/tokens';
import { PublicUsersRepositoryPort } from 'src/modules/auth/core/ports/public-users.repository.port';

@Injectable()
export class AssignGiftCardToUserUseCase {
  constructor(
    @Inject(GIFT_CARD_REPOSITORY)
    private readonly repo: GiftCardRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,

    @Inject(PUBLIC_USERS_REPOSITORY)
    private readonly publicUsersRepo: PublicUsersRepositoryPort,
  ) {}

  async execute(input: {
    giftCardId: string;
    userId: string;
    user: AuthenticatedUser;
  }) {
    // =========================
    // VALIDACIONES BASICAS
    // =========================
    if (!input.giftCardId || !input.userId) {
      throw new BadRequestException('Datos incompletos');
    }

    // =========================
    // 🔥 VALIDAR PUBLIC USER
    // =========================
    const publicUser = await this.publicUsersRepo.findById(input.userId);

    if (!publicUser) {
      throw new NotFoundException('Public user not found');
    }

    // =========================
    // 🔥 VALIDAR GIFT CARD
    // =========================
    const card = await this.repo.findById(input.giftCardId);

    if (!card) {
      throw new NotFoundException('Gift card not found');
    }

    // =========================
    // 🔥 VALIDAR BRANCH
    // =========================
    const branch = await this.branchesRepo.findById(card.branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // =========================
    // 🔥 ACCESS CONTROL
    // =========================
    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No autorizado');
    }

    // =========================
    // 🔥 BUSINESS RULE
    // =========================
    if (card.ownerUserId) {
      throw new BadRequestException('La gift card ya está asignada');
    }

    // =========================
    // 🔥 ASSIGN
    // =========================
    return this.repo.update(card.id, {
      ownerUserId: publicUser.id,
    });
  }
}
