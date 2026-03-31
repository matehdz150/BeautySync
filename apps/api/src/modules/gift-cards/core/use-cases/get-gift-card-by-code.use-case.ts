import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GIFT_CARD_REPOSITORY } from '../ports/tokens';
import {
  BRANCH_IMAGES_REPOSITORY,
  BRANCHES_REPOSITORY,
} from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { GiftCardRepository } from '../ports/gift-card.repository';
import { BranchImagesRepository } from 'src/modules/branches/core/ports/branch-images.repository';

@Injectable()
export class GetGiftCardByCodeUseCase {
  constructor(
    @Inject(GIFT_CARD_REPOSITORY)
    private readonly repo: GiftCardRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,

    @Inject(BRANCH_IMAGES_REPOSITORY)
    private readonly branchImagesRepo: BranchImagesRepository,
  ) {}

  async execute(code: string) {
    if (!code) {
      throw new BadRequestException('Código requerido');
    }

    const giftCard = await this.repo.findByCode(code);

    if (!giftCard) {
      throw new NotFoundException('Gift card no encontrada');
    }

    const branch = await this.branchesRepo.getBasic(giftCard.branchId);
    const images = await this.branchImagesRepo.getByBranch(giftCard.branchId);

    const coverUrl = images?.[0]?.url ?? null;

    return {
      code: giftCard.code,
      balanceCents: giftCard.balanceCents,
      currency: giftCard.currency,

      status: giftCard.status,

      // 🔥 UX flags (no leaks)
      isClaimed: !!giftCard.ownerUserId,
      isExpired: giftCard.expiresAt && giftCard.expiresAt < new Date(),

      branch: {
        id: branch?.id,
        name: branch?.name ?? 'Negocio',
        address: branch?.address ?? null,
        description: branch?.description ?? null,
        coverUrl,
      },
    };
  }
}
