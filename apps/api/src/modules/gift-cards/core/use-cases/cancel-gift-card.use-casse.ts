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

@Injectable()
export class CancelGiftCardUseCase {
  constructor(
    @Inject(GIFT_CARD_REPOSITORY)
    private readonly repo: GiftCardRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: { giftCardId: string; user: AuthenticatedUser }) {
    const giftCard = await this.repo.findById(input.giftCardId);

    if (!giftCard) {
      throw new NotFoundException('Gift card no encontrada');
    }

    const branch = await this.branchesRepo.findById(giftCard.branchId);

    if (!branch) {
      throw new NotFoundException('Branch no encontrada');
    }

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No tienes acceso');
    }

    // 🔥 validaciones de estado
    if (giftCard.status === 'cancelled') {
      throw new BadRequestException('La gift card ya está cancelada');
    }

    if (giftCard.status === 'redeemed') {
      throw new BadRequestException(
        'No puedes cancelar una gift card ya usada',
      );
    }

    // 🔥 cancelar
    const updated = await this.repo.update(giftCard.id, {
      status: 'cancelled',
    });

    return {
      success: true,
      giftCard: updated,
    };
  }
}
