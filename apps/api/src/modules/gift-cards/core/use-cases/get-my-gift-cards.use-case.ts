import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { GiftCardRepository } from '../ports/gift-card.repository';
import { GIFT_CARD_REPOSITORY } from '../ports/tokens';

@Injectable()
export class GetMyGiftCardsUseCase {
  constructor(
    @Inject(GIFT_CARD_REPOSITORY)
    private readonly repo: GiftCardRepository,
  ) {}

  async execute(userId: string) {
    if (!userId) {
      throw new BadRequestException('userId requerido');
    }

    return this.repo.findByUser(userId);
  }
}
