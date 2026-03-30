import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { GIFT_CARD_REPOSITORY } from '../ports/tokens';
import { GiftCardRepository } from '../ports/gift-card.repository';

import {
  BRANCHES_REPOSITORY,
  BRANCH_IMAGES_REPOSITORY,
} from 'src/modules/branches/core/ports/tokens';

import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { BranchImagesRepository } from 'src/modules/branches/core/ports/branch-images.repository';

import { mailQueue } from 'src/modules/queues/mail/mail.queue';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

@Injectable()
export class ResendGiftCardUseCase {
  constructor(
    @Inject(GIFT_CARD_REPOSITORY)
    private readonly repo: GiftCardRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,

    @Inject(BRANCH_IMAGES_REPOSITORY)
    private readonly imagesRepo: BranchImagesRepository,
  ) {}

  async execute(input: {
    giftCardId: string;
    email?: string; // 🔥 opcional override
    user: AuthenticatedUser;
  }) {
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

    // 🔥 email destino
    const to = input.email ?? giftCard.issuedToEmail;

    if (!to) {
      throw new BadRequestException('No hay email para reenviar');
    }

    if (giftCard.status !== 'active') {
      throw new BadRequestException(
        'Solo se pueden reenviar gift cards activas',
      );
    }

    const images = await this.imagesRepo.getByBranch(branch.id);
    const coverUrl = images?.[0]?.url ?? null;

    await mailQueue.add('gift-card-issued', {
      to,
      code: giftCard.code,
      amountCents: giftCard.initialAmountCents,
      organization: branch.organizationId,
      branch: branch.name,
      claimLink: `${process.env.PUBLIC_APP_URL}/gift-card/claim/${giftCard.code}`,
      coverUrl,
    });

    return { success: true };
  }
}
